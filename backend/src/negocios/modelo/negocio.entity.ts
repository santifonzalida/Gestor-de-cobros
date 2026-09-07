import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Negocio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  descripcion: string;

  @Column({ default: true })
  activo: boolean;

  @Column({ nullable: true })
  fechaAlta: Date;

  @Column({ nullable: true })
  fechaModificacion: Date | null;

  @Column({ nullable: true })
  fechaBaja: Date | null;

  @Column({ nullable: true })
  logoUrl?: string;

  /**
   * Email del futuro administrador, cargado al crear el negocio desde el
   * panel Superadmin — no dispara ningún envío por sí solo, solo queda
   * guardado para precargar la invitación cuando se dispare como acción
   * aparte (`SuperadminService.invitarAdmin`).
   */
  @Column({ nullable: true })
  emailAdmin: string | null;
}
