export interface NegocioResumen {
  id: number;
  nombre: string;
  activo: boolean;
  fechaAlta: Date | null;
  emailAdmin: string | null;
  alumnos: number;
  admins: number;
  ultimoAcceso: Date | null;
}
