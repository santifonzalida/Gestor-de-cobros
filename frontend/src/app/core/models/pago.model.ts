export type MetodoPago = 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA' | 'MERCADOPAGO';

export interface Pago {
  id: number;
  cuotaId: number;
  metodo: MetodoPago;
  montoPagado: number;
  fechaPago: Date;
  comprobanteUrl?: string;
}
