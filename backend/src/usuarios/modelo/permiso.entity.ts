import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('permisos')
export class Permiso {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nombre: string;

  @Column()
  descripcion: string;
}
