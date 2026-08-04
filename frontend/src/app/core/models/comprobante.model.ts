export enum EstadoComprobante {
  EN_REVISION = 'EN_REVISION',
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO',
}

export interface Comprobante {
  id: number;
  key: string;
  estado: EstadoComprobante;
  fechaCarga: Date;
  fechaRevision?: Date;
  alumno: { id: number; nombre: string; apellido: string };
  claseId?: number;
  mes: number;
  anio: number;
  revisadoPor?: { id: number; email: string };
}
