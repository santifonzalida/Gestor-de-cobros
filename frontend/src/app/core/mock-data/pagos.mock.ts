import { Pago } from '../models/pago.model';

export const PAGOS_MOCK: Pago[] = [
  { id: 1, cuotaId: 6, comprobanteNombre: 'comprobante_camila_jul.jpg', fechaCarga: new Date('2026-07-18'), cargadoPor: 'alumno' },
  { id: 2, cuotaId: 14, comprobanteNombre: 'comprobante_joaquin_jul.pdf', fechaCarga: new Date('2026-07-17'), cargadoPor: 'alumno' },
  { id: 3, cuotaId: 15, comprobanteNombre: 'comprobante_jun.pdf', fechaCarga: new Date('2026-06-04'), cargadoPor: 'alumno' },
  { id: 4, cuotaId: 16, comprobanteNombre: 'comprobante_jul.jpg', fechaCarga: new Date('2026-07-04'), cargadoPor: 'alumno' },
];
