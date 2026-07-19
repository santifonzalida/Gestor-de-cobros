import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  ManyToOne,
} from 'typeorm';
import { Cuota } from '../../cuotas/modelo/cuota.entity';
import { Usuario } from '../../usuarios/modelo/usuario.entity';
import { MetodoPago } from './metodo-pago.enum';

@Entity()
export class Pago {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Cuota, (cuota) => cuota.pago)
  cuota: Cuota;

  @Column({ type: 'enum', enum: MetodoPago })
  metodo: MetodoPago;

  @Column()
  montoPagado: number;

  @Column()
  fechaPago: Date;

  @Column({ nullable: true })
  comprobanteUrl?: string;

  @ManyToOne(() => Usuario, { nullable: true })
  registradoPor?: Usuario;
}
