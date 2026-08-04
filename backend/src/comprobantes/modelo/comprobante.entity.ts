import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Cuota } from '../../cuotas/modelo/cuota.entity';
import { Usuario } from '../../usuarios/modelo/usuario.entity';
import { Negocio } from '../../negocios/modelo/negocio.entity';
import { EstadoComprobante } from './estado-comprobante.enum';

/**
 * Historial de cada intento de carga de comprobante, independiente del
 * estado "en vivo" que vive en Cuota.comprobanteUrl/estado. A diferencia de
 * ese campo (que se limpia al rechazar), acá una fila queda para siempre,
 * incluso si el comprobante fue rechazado.
 */
@Entity()
export class Comprobante {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Negocio, { nullable: false })
  negocio: Negocio;

  @ManyToOne(() => Cuota, { nullable: false, onDelete: 'RESTRICT' })
  cuota: Cuota;

  @Column()
  key: string;

  @Column({ type: 'enum', enum: EstadoComprobante })
  estado: EstadoComprobante;

  @Column()
  fechaCarga: Date;

  @Column({ nullable: true })
  fechaRevision?: Date;

  @ManyToOne(() => Usuario, { nullable: true })
  revisadoPor?: Usuario;
}
