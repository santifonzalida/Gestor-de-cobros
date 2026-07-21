import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Alumno } from '../../alumnos/modelo/alumno.entity';
import { Pago } from '../../pagos/modelo/pago.entity';
import { Negocio } from '../../negocios/modelo/negocio.entity';
import { EstadoCuota } from './estado-cuota.enum';

@Entity()
@Unique(['alumno', 'mes', 'anio'])
export class Cuota {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Negocio, { nullable: false })
  negocio: Negocio;

  @ManyToOne(() => Alumno, (alumno) => alumno.cuotas)
  alumno: Alumno;

  @Column()
  mes: number;

  @Column()
  anio: number;

  @Column()
  monto: number;

  @Column({ type: 'enum', enum: EstadoCuota })
  estado: EstadoCuota;

  @Column()
  fechaVencimiento: Date;

  @OneToOne(() => Pago, (pago) => pago.cuota)
  @JoinColumn()
  pago: Pago;
}
