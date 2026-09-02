/**
 * Un torneo/liga con fecha ya pasada se considera finalizado sin importar
 * lo que diga el campo `activo` del backend. Antes esta misma comparación
 * vivía duplicada (con firmas ligeramente distintas) en torneos.ts,
 * torneo-detalles.ts, ligas.ts y detalles-liga.ts.
 */
export function esFechaFinalizada(fecha: Date | string): boolean {
  const fechaComparar = new Date(fecha);
  const hoy = new Date();

  fechaComparar.setHours(0, 0, 0, 0);
  hoy.setHours(0, 0, 0, 0);

  return fechaComparar < hoy;
}

export function verificarActivoPorFecha(fecha: Date | string | undefined, activoBackend: boolean | number | undefined): boolean {
  if (fecha && esFechaFinalizada(fecha)) {
    return false;
  }
  return activoBackend === undefined ? true : !!activoBackend;
}
