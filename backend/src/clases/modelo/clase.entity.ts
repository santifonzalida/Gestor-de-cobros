import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Negocio } from '../../negocios/modelo/negocio.entity';

@Entity()
export class Clase {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Negocio, { nullable: false })
  negocio: Negocio;

  @Column()
  nombre: string;

  @Column()
  icono: string;
}