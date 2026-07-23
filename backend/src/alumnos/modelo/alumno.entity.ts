import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { Usuario } from '../../usuarios/modelo/usuario.entity';
import { Cuota } from '../../cuotas/modelo/cuota.entity';
import { Negocio } from '../../negocios/modelo/negocio.entity';
import { Clase } from '../../clases/modelo/clase.entity';

@Entity()
export class Alumno {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Negocio, { nullable: false })
  negocio: Negocio;

  @ManyToOne(() => Clase, { nullable: true })
  clase?: Clase;

  @Column()
  nombre: string;

  @Column()
  apellido: string;

  @Column({ nullable: true })
  telefono?: string;

  @Column({ nullable: true })
  email?: string;

  @Column()
  fechaAlta: Date;

  @Column()
  activo: boolean;

  @OneToOne(() => Usuario, (usuario) => usuario.alumno, { nullable: true })
  @JoinColumn()
  usuario?: Usuario;

  @OneToMany(() => Cuota, (cuota) => cuota.alumno)
  cuotas: Cuota[];
}
