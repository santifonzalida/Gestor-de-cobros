import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alumno } from '../../alumnos/modelo/alumno.entity';
import { AuthService } from '../../auth/services/auth.service';
import { Negocio } from '../../negocios/modelo/negocio.entity';
import { NegociosService } from '../../negocios/servicios/negocios.service';
import { Usuario } from '../../usuarios/modelo/usuario.entity';
import { UsuarioService } from '../../usuarios/servicios/usuarios.service';
import { CrearNegocioSuperadminDto } from '../dtos/crear-negocio-superadmin.dto';
import { CrearSuperadminDto } from '../dtos/crear-superadmin.dto';
import { InvitarAdminDto } from '../dtos/invitar-admin.dto';

export interface NegocioResumen {
  id: number;
  nombre: string;
  activo: boolean;
  fechaAlta: Date | null;
  emailAdmin: string | null;
  alumnos: number;
  admins: number;
  ultimoAcceso: Date | null;
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
    private readonly usuarioService: UsuarioService,
    private readonly negociosService: NegociosService,
    private readonly authService: AuthService,
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
        const [alumnos, admins, ultimoAccesoRow] = await Promise.all([
          this.repoAlumnos.count({
            where: { negocio: { id: negocio.id }, activo: true },
          }),
          this.repoUsuarios.count({
            where: {
              negocio: { id: negocio.id },
              roles: { nombre: 'ADMIN' },
            },
          }),
          this.repoUsuarios
            .createQueryBuilder('usuario')
            .select('MAX(usuario.ultimoAcceso)', 'max')
            .where('usuario.negocio = :negocioId', { negocioId: negocio.id })
            .getRawOne<{ max: Date | null }>(),
        ]);

        return {
          id: negocio.id,
          nombre: negocio.nombre,
          activo: negocio.activo,
          fechaAlta: negocio.fechaAlta,
          emailAdmin: negocio.emailAdmin,
          alumnos,
          admins,
          ultimoAcceso: ultimoAccesoRow?.max ?? null,
        };
      }),
    );
  }

  /**
   * Alta de un negocio nuevo desde el panel — reemplaza el `POST /negocios`
   * manual por curl (ver context.md). Deliberadamente **no** invita a ningún
   * admin en el mismo paso — eso es una acción aparte (`invitarAdmin`), para
   * no mandar un mail antes de que el superadmin confirme que está todo bien
   * cargado. `emailAdmin` se guarda igual en el negocio para precargar esa
   * invitación cuando se dispare.
   */
  async crearNegocio(dto: CrearNegocioSuperadminDto): Promise<NegocioResumen> {
    const negocio = await this.negociosService.crear({ nombre: dto.nombre });
    negocio.emailAdmin = dto.emailAdmin;
    await this.repoNegocios.save(negocio);

    return {
      id: negocio.id,
      nombre: negocio.nombre,
      activo: negocio.activo,
      fechaAlta: negocio.fechaAlta,
      emailAdmin: negocio.emailAdmin,
      alumnos: 0,
      admins: 0,
      ultimoAcceso: null,
    };
  }

  /**
   * Invita a un admin para un negocio ya existente — la única vía para sumar
   * el primer admin (o uno adicional) a un negocio, ver `crearNegocio`.
   */
  async invitarAdmin(negocioId: number, dto: InvitarAdminDto): Promise<{ message: string }> {
    return this.authService.generarInvitacionAdmin(negocioId, dto.email, dto.nombre, dto.apellido);
  }

  /**
   * Baja/reactivación desde el panel superadmin. Ojo: hoy esto es puramente
   * informativo — `Negocio.activo` en false no bloquea el login de los
   * admins/alumnos de ese negocio (no hay ningún chequeo de esto en
   * `AuthService.login`), solo cambia lo que se muestra acá.
   */
  async cambiarEstadoNegocio(id: number, activo: boolean): Promise<{ id: number; activo: boolean }> {
    const negocio = await this.repoNegocios.findOne({ where: { id } });
    if (!negocio) {
      throw new NotFoundException('No se encontró el negocio.');
    }
    negocio.activo = activo;
    negocio.fechaBaja = activo ? null : new Date();
    negocio.fechaModificacion = new Date();
    await this.repoNegocios.save(negocio);
    return { id: negocio.id, activo: negocio.activo };
  }
}
