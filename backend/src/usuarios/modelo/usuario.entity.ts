import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { ManyToMany, JoinTable } from 'typeorm';
import { Alumno } from '../../alumnos/modelo/alumno.entity';
import { Rol } from './rol.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

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
