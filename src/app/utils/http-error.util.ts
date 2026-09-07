import { HttpErrorResponse } from '@angular/common/http';

/**
 * Extrae el mensaje real de un error HTTP del backend.
 * El backend siempre responde con { mensaje, errores? } (errores?
 * en fallos de validación Zod, uno por campo) — nunca `message`.
 * Si no hay body reconocible, cae a un mensaje genérico.
 */
export function extraerMensajeError(
  error: HttpErrorResponse,
  fallback = 'Ha ocurrido un error desconocido'
): string {
  if (error.error instanceof ErrorEvent) {
    return `Error: ${error.error.message}`;
  }

  if (error.status === 0) {
    return 'No se pudo conectar con el servidor';
  }

  const body = error.error;
  if (body?.errores && Array.isArray(body.errores) && body.errores.length > 0) {
    return body.errores.join(' · ');
  }

  return body?.mensaje || body?.message || fallback;
}
