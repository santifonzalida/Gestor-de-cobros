import { Alumno } from '../models/alumno.model';

export const ALUMNOS_MOCK: Alumno[] = [
  { id: 1, nombre: 'Martina', apellido: 'Gómez', email: 'martina.gomez@mail.com', claseId: 1, fechaAlta: new Date('2025-03-10'), activo: true },
  { id: 2, nombre: 'Bruno', apellido: 'Ibáñez', email: 'bruno.ibanez@mail.com', claseId: 1, fechaAlta: new Date('2025-04-02'), activo: true },
  { id: 3, nombre: 'Camila', apellido: 'Suárez', email: 'camila.suarez@mail.com', claseId: 1, fechaAlta: new Date('2025-02-18'), activo: true },
  { id: 4, nombre: 'Franco', apellido: 'Núñez', email: 'franco.nunez@mail.com', claseId: 1, fechaAlta: new Date('2025-06-05'), activo: true },
  { id: 5, nombre: 'Lucas', apellido: 'Fernández', email: 'lucas.fernandez@mail.com', claseId: 2, fechaAlta: new Date('2025-01-20'), activo: true },
  { id: 6, nombre: 'Valentina', apellido: 'Torres', email: 'valentina.torres@mail.com', claseId: 2, fechaAlta: new Date('2025-05-14'), activo: true },
  { id: 7, nombre: 'Joaquín', apellido: 'Vega', email: 'joaquin.vega@mail.com', claseId: 2, fechaAlta: new Date('2025-03-30'), activo: true },
  { id: 8, nombre: 'Sofía', apellido: 'Torres', email: 'sofia.torres@mail.com', claseId: 3, fechaAlta: new Date('2025-03-01'), activo: true },
  { id: 9, nombre: 'Thiago', apellido: 'Medina', email: 'thiago.medina@mail.com', claseId: 3, fechaAlta: new Date('2025-04-22'), activo: true },
];
