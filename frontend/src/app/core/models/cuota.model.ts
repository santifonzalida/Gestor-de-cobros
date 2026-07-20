export enum EstadoCuota {
  PENDIENTE = 'PENDIENTE',
  PAGADA = 'PAGADA',
  VENCIDA = 'VENCIDA',
  EN_REVISION = 'EN_REVISION',
}

export interface Cuota {
  id: number;
  alumnoId: number;
  mes: number;
  anio: number;
  monto: number;
  estado: EstadoCuota;
  fechaVencimiento: Date;
}
