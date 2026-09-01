import { Clase } from './clase.model';
import { Cuota } from './cuota.model';

export interface Alumno {
  id: number;
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  fechaAlta: Date;
  activo: boolean;
  usuario?: { id: number };
}

/**
 * No existe como columna en ningún lado: el backend lo calcula en cada
 * request a partir del estado/vencimiento de la cuota actual del alumno
 * (ver `CuotasService.calcularEstadoPago`), pero no se persiste.
 */
export type EstadoPago = 'al_dia' | 'proximo' | 'adeuda';

export interface AlumnoConEstado extends Alumno {
  clase?: Clase;
  estadoPago: EstadoPago;
  cuotaActual?: Cuota;
}
