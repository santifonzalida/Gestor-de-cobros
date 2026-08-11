export interface NegocioResumen {
  id: number;
  nombre: string;
  activo: boolean;
  fechaAlta: Date | null;
  alumnos: number;
  admins: number;
  ultimoAcceso: Date | null;
  totalCobrado: number;
  cuotasPendientes: number;
}
