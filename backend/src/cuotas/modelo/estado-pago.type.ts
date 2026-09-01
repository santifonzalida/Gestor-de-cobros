/**
 * Estado de pago "resumen" de un alumno, derivado de su cuotaActual — no es
 * una columna real en ningún lado (ni Alumno ni Cuota), se calcula en cada
 * request a partir del estado/fechaVencimiento de la cuota más relevante del
 * alumno. Ver `CuotasService.calcularEstadoPago`.
 */
export type EstadoPago = 'al_dia' | 'proximo' | 'adeuda';
