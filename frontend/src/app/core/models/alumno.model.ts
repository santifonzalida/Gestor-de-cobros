import { Clase } from './clase.model';
import { Cuota } from './cuota.model';

export interface Alumno {
  id: number;
  nombre: string;
  apellido: string;
  email?: string;
  claseId: number;
  fechaAlta: Date;
  activo: boolean;
}

/**
 * No existe como columna en el backend (`Alumno` no tiene este campo):
 * se deriva en el frontend a partir del estado/vencimiento de la cuota
 * más reciente del alumno.
 */
export type EstadoPago = 'al_dia' | 'proximo' | 'adeuda';

export interface AlumnoConEstado extends Alumno {
  clase: Clase;
  estadoPago: EstadoPago;
  cuotaActual?: Cuota;
}
