import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { ManyToMany, JoinTable } from 'typeorm';
import { Permiso } from './permiso.entity';

@Entity('roles')
export class Rol {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nombre: string;

  @Column()
  descripcion: string;

  @ManyToMany(() => Permiso)
  @JoinTable({
    name: 'permiso_roles',
    joinColumn: { name: 'idRol' },
    inverseJoinColumn: { name: 'idPermiso' },
  })
  permisos: Permiso[];
}
