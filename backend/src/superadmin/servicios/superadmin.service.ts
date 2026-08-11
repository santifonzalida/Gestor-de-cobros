import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alumno } from '../../alumnos/modelo/alumno.entity';
import { Cuota } from '../../cuotas/modelo/cuota.entity';
import { EstadoCuota } from '../../cuotas/modelo/estado-cuota.enum';
import { Negocio } from '../../negocios/modelo/negocio.entity';
import { Pago } from '../../pagos/modelo/pago.entity';
import { Usuario } from '../../usuarios/modelo/usuario.entity';
import { UsuarioService } from '../../usuarios/servicios/usuarios.service';
import { CrearSuperadminDto } from '../dtos/crear-superadmin.dto';

export interface NegocioResumen {
  id: number;
  nombre: string;
  activo: boolean;
  fechaAlta: Date | null;
  alumnos: number;
  admins: number;
  ultimoAcceso: Date | null;
  totalCobrado: number;
  cuotasPendientes: number;
}

@Injectable()
export class SuperadminService {
  constructor(
    @InjectRepository(Negocio)
    private readonly repoNegocios: Repository<Negocio>,
    @InjectRepository(Alumno)
    private readonly repoAlumnos: Repository<Alumno>,
    @InjectRepository(Usuario)
    private readonly repoUsuarios: Repository<Usuario>,
    @InjectRepository(Pago)
    private readonly repoPagos: Repository<Pago>,
    @InjectRepository(Cuota)
    private readonly repoCuotas: Repository<Cuota>,
    private readonly usuarioService: UsuarioService,
  ) {}

  async crear(dto: CrearSuperadminDto): Promise<Omit<Usuario, 'password'>> {
    const rolSuperadmin = await this.usuarioService.findByName('SUPERADMIN');
    if (!rolSuperadmin) {
      throw new BadRequestException(
        `El rol 'SUPERADMIN' no existe — hay que insertarlo a mano (ver context.md).`,
      );
    }

    const usuario = await this.usuarioService.create(
      dto.email,
      dto.password,
      undefined,
      dto.nombre,
      dto.apellido,
    );
    usuario.roles = [rolSuperadmin];
    const guardado = await this.usuarioService.save(usuario);

    const { password, ...resto } = guardado;
    return resto;
  }

  /**
   * Único lugar del proyecto donde se consulta a propósito sin filtrar por
   * negocioId de la sesión — acá el "tenant" de la request es la plataforma
   * entera, no un negocio puntual (solo lo llama SUPERADMIN). En cualquier
   * otro service esto sería la fuga cross-tenant que el resto del código
   * evita religiosamente.
   */
  async listarNegocios(): Promise<NegocioResumen[]> {
    const negocios = await this.repoNegocios.find({ order: { id: 'ASC' } });

    return Promise.all(
      negocios.map(async (negocio) => {
        const [alumnos, admins, ultimoAccesoRow, totalCobradoRow, cuotasPendientes] =
          await Promise.all([
            this.repoAlumnos.count({
              where: { negocio: { id: negocio.id }, activo: true },
            }),
            this.repoUsuarios.count({
              where: { negocio: { id: negocio.id }, roles: { nombre: 'ADMIN' } },
            }),
            this.repoUsuarios
              .createQueryBuilder('usuario')
              .select('MAX(usuario.ultimoAcceso)', 'max')
              .where('usuario.negocio = :negocioId', { negocioId: negocio.id })
              .getRawOne<{ max: Date | null }>(),
            this.repoPagos
              .createQueryBuilder('pago')
              .select('SUM(pago.montoPagado)', 'total')
              .where('pago.negocio = :negocioId', { negocioId: negocio.id })
              .getRawOne<{ total: string | null }>(),
            this.repoCuotas.count({
              where: [
                { negocio: { id: negocio.id }, estado: EstadoCuota.PENDIENTE },
                { negocio: { id: negocio.id }, estado: EstadoCuota.VENCIDA },
              ],
            }),
          ]);

        return {
          id: negocio.id,
          nombre: negocio.nombre,
          activo: negocio.activo,
          fechaAlta: negocio.fechaAlta,
          alumnos,
          admins,
          ultimoAcceso: ultimoAccesoRow?.max ?? null,
          totalCobrado: Number(totalCobradoRow?.total ?? 0),
          cuotasPendientes,
        };
      }),
    );
  }
}
