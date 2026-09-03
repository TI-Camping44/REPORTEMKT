/**
 * Lectura de hojas de Google Sheets con una cuenta de servicio.
 *
 * Solo servidor. La credencial vive en GOOGLE_CUENTA_SERVICIO y nunca llega al
 * navegador.
 *
 * Se firma el token a mano con node:crypto en lugar de sumar la libreria
 * googleapis: para leer un rango hacen falta dos peticiones HTTP, y esa
 * libreria pesa varios megabytes en cada funcion de Vercel.
 */

import { createSign } from 'node:crypto';

const AMBITO = 'https://www.googleapis.com/auth/spreadsheets.readonly';
const URL_DEL_TOKEN = 'https://oauth2.googleapis.com/token';
const DURACION_DEL_TOKEN = 3600;

type CuentaDeServicio = {
  client_email: string;
  private_key: string;
};

type TokenEnCache = {
  valor: string;
  venceEn: number;
};

let tokenEnCache: TokenEnCache | null = null;

export class ErrorDePlanilla extends Error {}

function leerCredencial(): CuentaDeServicio {
  const crudo = process.env.GOOGLE_CUENTA_SERVICIO;

  if (crudo === undefined || crudo.trim() === '') {
    throw new ErrorDePlanilla(
      'Falta la variable de entorno GOOGLE_CUENTA_SERVICIO. TI tiene que cargar la credencial de la cuenta de servicio de Google.',
    );
  }

  // Se admite el JSON tal cual o codificado en base64, que es como resulta mas
  // comodo pegarlo en las variables de entorno de Vercel.
  const texto = crudo.trim().startsWith('{')
    ? crudo
    : Buffer.from(crudo, 'base64').toString('utf8');

  let credencial: unknown;
  try {
    credencial = JSON.parse(texto);
  } catch {
    throw new ErrorDePlanilla(
      'La credencial de Google no es un JSON válido. Vuelva a cargar el archivo de la cuenta de servicio.',
    );
  }

  const { client_email: correo, private_key: clave } = credencial as Partial<CuentaDeServicio>;

  if (typeof correo !== 'string' || typeof clave !== 'string') {
    throw new ErrorDePlanilla(
      'La credencial de Google no tiene client_email y private_key. Use el archivo JSON que descarga Google Cloud al crear la clave.',
    );
  }

  return { client_email: correo, private_key: clave };
}

function enBase64Url(valor: string | Buffer): string {
  const buffer = typeof valor === 'string' ? Buffer.from(valor, 'utf8') : valor;
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Token de acceso de la cuenta de servicio, reutilizado mientras siga vigente. */
async function obtenerToken(): Promise<string> {
  const ahora = Math.floor(Date.now() / 1000);

  // Se descarta un minuto antes de que venza, para no usarlo justo en el borde.
  if (tokenEnCache !== null && tokenEnCache.venceEn > ahora + 60) {
    return tokenEnCache.valor;
  }

  const credencial = leerCredencial();

  const encabezado = enBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const cuerpo = enBase64Url(
    JSON.stringify({
      iss: credencial.client_email,
      scope: AMBITO,
      aud: URL_DEL_TOKEN,
      iat: ahora,
      exp: ahora + DURACION_DEL_TOKEN,
    }),
  );

  const firmador = createSign('RSA-SHA256');
  firmador.update(`${encabezado}.${cuerpo}`);
  const firma = enBase64Url(firmador.sign(credencial.private_key));

  const respuesta = await fetch(URL_DEL_TOKEN, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${encabezado}.${cuerpo}.${firma}`,
    }),
    cache: 'no-store',
  });

  if (!respuesta.ok) {
    throw new ErrorDePlanilla(
      'Google rechazó la credencial de la cuenta de servicio. Verifique que la clave sea la vigente y que la API de Google Sheets esté habilitada.',
    );
  }

  const datos = (await respuesta.json()) as { access_token?: string; expires_in?: number };
  if (typeof datos.access_token !== 'string') {
    throw new ErrorDePlanilla('Google no devolvió un token de acceso. Vuelva a intentarlo en unos minutos.');
  }

  tokenEnCache = {
    valor: datos.access_token,
    venceEn: ahora + (datos.expires_in ?? DURACION_DEL_TOKEN),
  };

  return tokenEnCache.valor;
}

/**
 * Extrae el identificador de una hoja a partir de lo que se pegue: la direccion
 * completa del navegador o el identificador suelto.
 */
export function identificadorDePlanilla(valor: string): string {
  const limpio = valor.trim();
  const coincidencia = /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/.exec(limpio);
  if (coincidencia !== null && coincidencia[1] !== undefined) return coincidencia[1];
  return limpio;
}

/**
 * Nombres de las pestanas de una planilla.
 *
 * Sirve para no tener que adivinar el rango: quien configura el bloque ve la
 * lista y escribe el nombre tal cual, sin ir a mirar las solapas de la hoja.
 */
export async function listarPestanas(planillaId: string): Promise<string[]> {
  const token = await obtenerToken();

  const direccion = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(planillaId)}`,
  );
  direccion.searchParams.set('fields', 'sheets.properties.title');

  const respuesta = await fetch(direccion, {
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (respuesta.status === 403) {
    throw new ErrorDePlanilla(
      'La cuenta de servicio no tiene acceso a esa planilla. Compártala con su correo, con permiso de lector.',
    );
  }

  if (respuesta.status === 404) {
    throw new ErrorDePlanilla(
      'No se encontró la planilla. Revise la dirección, y que sea una hoja de cálculo de Google y no un archivo de Excel subido a Drive.',
    );
  }

  if (!respuesta.ok) {
    throw new ErrorDePlanilla('No se pudo leer la planilla. Vuelva a intentarlo en unos minutos.');
  }

  const datos = (await respuesta.json()) as { sheets?: Array<{ properties?: { title?: string } }> };

  return (datos.sheets ?? [])
    .map((hoja) => hoja.properties?.title ?? '')
    .filter((titulo) => titulo !== '');
}

/**
 * Devuelve las celdas del rango como texto, fila por fila.
 *
 * Google recorta las filas y las columnas vacias del final, asi que las filas
 * pueden venir con distinta cantidad de celdas. Se rellenan para que el
 * consumidor no tenga que preocuparse por eso.
 */
export async function leerRango(planillaId: string, rango: string): Promise<string[][]> {
  const token = await obtenerToken();

  const direccion = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(planillaId)}/values/${encodeURIComponent(rango)}`,
  );
  direccion.searchParams.set('majorDimension', 'ROWS');
  direccion.searchParams.set('valueRenderOption', 'UNFORMATTED_VALUE');

  const respuesta = await fetch(direccion, {
    headers: { authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (respuesta.status === 403) {
    throw new ErrorDePlanilla(
      'La cuenta de servicio no tiene acceso a esa planilla. Compártala con su correo, con permiso de lector.',
    );
  }

  if (respuesta.status === 404) {
    throw new ErrorDePlanilla(
      'No se encontró la planilla. Revise la dirección, y que sea una hoja de cálculo de Google y no un archivo de Excel subido a Drive: la API de Sheets no lee archivos .xlsx.',
    );
  }

  if (respuesta.status === 400) {
    throw new ErrorDePlanilla(
      'El rango no es válido. Escríbalo con el nombre de la pestaña y las celdas, por ejemplo: Pautas!A1:E30',
    );
  }

  if (!respuesta.ok) {
    throw new ErrorDePlanilla('No se pudo leer la planilla. Vuelva a intentarlo en unos minutos.');
  }

  const datos = (await respuesta.json()) as { values?: unknown[][] };
  const filas = datos.values ?? [];

  const ancho = filas.reduce((maximo, fila) => Math.max(maximo, fila.length), 0);

  return filas.map((fila) =>
    Array.from({ length: ancho }, (_, columna) => {
      const celda = fila[columna];
      if (celda === null || celda === undefined) return '';
      return String(celda);
    }),
  );
}
