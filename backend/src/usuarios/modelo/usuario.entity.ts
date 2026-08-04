import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  ManyToOne,
} from 'typeorm';
import { ManyToMany, JoinTable } from 'typeorm';
import { Alumno } from '../../alumnos/modelo/alumno.entity';
import { Negocio } from '../../negocios/modelo/negocio.entity';
import { Rol } from './rol.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Negocio, { nullable: true })
  negocio?: Negocio;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  nombre?: string;

  @Column({ nullable: true })
  apellido?: string;

  /** Color de acento elegido por el usuario para personalizar el Portal (hex). Null = usar el default de la app. */
  @Column({ nullable: true })
  colorAccento?: string;

  @Column()
  fechaAlta: Date;

  @Column()
  fechaModificacion: Date;

  @Column()
  ultimoAcceso: Date;

  @OneToOne(() => Alumno, (alumno) => alumno.usuario)
  alumno: Alumno;

  @ManyToMany(() => Rol)
  @JoinTable({
    name: 'roles_usuarios',
    joinColumn: { name: 'idUsuario' },
    inverseJoinColumn: { name: 'idRol' },
  })
  roles: Rol[];
}
