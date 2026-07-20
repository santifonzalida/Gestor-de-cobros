export type MetodoPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'MERCADOPAGO';

export interface Pago {
  id: number;
  cuotaId: number;
  comprobanteNombre: string;
  fechaCarga: Date;
  cargadoPor: 'alumno' | 'admin';
}
