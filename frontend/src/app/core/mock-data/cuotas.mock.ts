import { Cuota, EstadoCuota } from '../models/cuota.model';

const MONTO_POR_CLASE: Record<number, number> = {
  1: 28000, // Fútbol
  2: 26000, // Taekwondo
  3: 30000, // Boxeo
};

let nextId = 1;
function cuota(
  alumnoId: number,
  mes: number,
  anio: number,
  estado: EstadoCuota,
  fechaVencimiento: string,
  claseId: number,
): Cuota {
  return {
    id: nextId++,
    alumnoId,
    mes,
    anio,
    monto: MONTO_POR_CLASE[claseId],
    estado,
    fechaVencimiento: new Date(fechaVencimiento),
  };
}

export const CUOTAS_MOCK: Cuota[] = [
  // Martina Gómez (Fútbol) — al día
  cuota(1, 6, 2026, EstadoCuota.PAGADA, '2026-06-05', 1),
  cuota(1, 7, 2026, EstadoCuota.PAGADA, '2026-07-05', 1),

  // Bruno Ibáñez (Fútbol) — adeuda
  cuota(2, 5, 2026, EstadoCuota.PAGADA, '2026-05-05', 1),
  cuota(2, 6, 2026, EstadoCuota.VENCIDA, '2026-07-05', 1),

  // Camila Suárez (Fútbol) — comprobante en revisión
  cuota(3, 6, 2026, EstadoCuota.PAGADA, '2026-06-05', 1),
  cuota(3, 7, 2026, EstadoCuota.EN_REVISION, '2026-07-05', 1),

  // Franco Núñez (Fútbol) — al día
  cuota(4, 6, 2026, EstadoCuota.PAGADA, '2026-06-05', 1),
  cuota(4, 7, 2026, EstadoCuota.PAGADA, '2026-07-05', 1),

  // Lucas Fernández (Taekwondo) — vence pronto
  cuota(5, 6, 2026, EstadoCuota.PAGADA, '2026-06-22', 2),
  cuota(5, 7, 2026, EstadoCuota.PENDIENTE, '2026-07-22', 2),

  // Valentina Torres (Taekwondo) — al día
  cuota(6, 6, 2026, EstadoCuota.PAGADA, '2026-06-05', 2),
  cuota(6, 7, 2026, EstadoCuota.PAGADA, '2026-07-05', 2),

  // Joaquín Vega (Taekwondo) — comprobante en revisión
  cuota(7, 6, 2026, EstadoCuota.PAGADA, '2026-06-05', 2),
  cuota(7, 7, 2026, EstadoCuota.EN_REVISION, '2026-07-05', 2),

  // Sofía Torres (Boxeo) — al día, próxima cuota recién generada
  cuota(8, 6, 2026, EstadoCuota.PAGADA, '2026-06-05', 3),
  cuota(8, 7, 2026, EstadoCuota.PAGADA, '2026-07-05', 3),
  cuota(8, 8, 2026, EstadoCuota.PENDIENTE, '2026-08-05', 3),

  // Thiago Medina (Boxeo) — al día
  cuota(9, 6, 2026, EstadoCuota.PAGADA, '2026-06-05', 3),
  cuota(9, 7, 2026, EstadoCuota.PAGADA, '2026-07-05', 3),
];
