import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ArchivosService,
  ObjetoDescargado,
} from '../../archivos/servicios/archivos.service';
import { UsuarioService } from '../../usuarios/servicios/usuarios.service';
import { Usuario } from '../../usuarios/modelo/usuario.entity';
import { ConfirmarLogoDto } from '../dtos/confirmar-logo.dto';
import { CrearAdminDto } from '../dtos/crear-admin.dto';
import { CrearNegocioDto } from '../dtos/crear-negocio.dto';
import { SolicitarSubidaLogoDto } from '../dtos/solicitar-subida-logo.dto';
import { Negocio } from '../modelo/negocio.entity';

export interface NegocioActual {
  id: number;
  nombre: string;
  logoUrl: string | null;
}

@Injectable()
export class NegociosService {
  constructor(
    @InjectRepository(Negocio)
    private readonly repo: Repository<Negocio>,
    private readonly archivosService: ArchivosService,
    private readonly usuarioService: UsuarioService,
    private readonly config: ConfigService,
  ) {}

  async crear(dto: CrearNegocioDto): Promise<Negocio> {
    const negocio = this.repo.create({
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      activo: true,
      fechaAlta: new Date(),
    });
    return this.repo.save(negocio);
  }

  async crearAdmin(
    negocioId: number,
    dto: CrearAdminDto,
  ): Promise<Omit<Usuario, 'password'>> {
    await this.obtenerActual(negocioId);

    const rolAdmin = await this.usuarioService.findByName('ADMIN');
    if (!rolAdmin) {
      throw new BadRequestException(
        `El rol 'ADMIN' no existe — corré antes "npm run seed:roles".`,
      );
    }

    const usuario = await this.usuarioService.create(
      dto.email,
      dto.password,
      negocioId,
      dto.nombre,
      dto.apellido,
    );
    usuario.roles = [rolAdmin];
    const guardado = await this.usuarioService.save(usuario);

    const { password, ...resto } = guardado;
    return resto;
  }

  async obtenerActual(negocioId: number): Promise<Negocio> {
    const negocio = await this.repo.findOne({ where: { id: negocioId } });
    if (!negocio) {
      throw new NotFoundException('No se encontró el negocio.');
    }
    return negocio;
  }

  construirUrlLogo(negocioId: number): string {
    const backendUrl =
      this.config.get<string>('BACKEND_URL') ?? 'http://localhost:3000';
    return `${backendUrl}/negocios/${negocioId}/logo`;
  }

  async obtenerActualConLogo(negocioId: number): Promise<NegocioActual> {
    const negocio = await this.obtenerActual(negocioId);
    return {
      id: negocio.id,
      nombre: negocio.nombre,
      logoUrl: negocio.logoUrl ? this.construirUrlLogo(negocio.id) : null,
    };
  }

  async solicitarSubidaLogo(
    negocioId: number,
    dto: SolicitarSubidaLogoDto,
  ): Promise<{ url: string; key: string }> {
    await this.obtenerActual(negocioId);
    const key = `logos/${negocioId}/${Date.now()}-${dto.nombreArchivo}`;
    const url = await this.archivosService.generarUrlSubida(
      key,
      dto.contentType,
    );
    return { url, key };
  }

  async confirmarLogo(
    negocioId: number,
    dto: ConfirmarLogoDto,
  ): Promise<NegocioActual> {
    const negocio = await this.obtenerActual(negocioId);
    const existe = await this.archivosService.existe(dto.key);
    if (!existe) {
      throw new NotFoundException(
        'El archivo todavía no llegó al almacenamiento. Probá de nuevo.',
      );
    }
    negocio.logoUrl = dto.key;
    await this.repo.save(negocio);
    return this.obtenerActualConLogo(negocioId);
  }

  async eliminarLogo(negocioId: number): Promise<NegocioActual> {
    await this.obtenerActual(negocioId);
    await this.repo
      .createQueryBuilder()
      .update(Negocio)
      .set({ logoUrl: null })
      .where('id = :id', { id: negocioId })
      .execute();
    return this.obtenerActualConLogo(negocioId);
  }

  async descargarLogo(negocioId: number): Promise<ObjetoDescargado> {
    const negocio = await this.obtenerActual(negocioId);
    if (!negocio.logoUrl) {
      throw new NotFoundException('Este negocio no tiene un logo cargado.');
    }
    return this.archivosService.descargarObjeto(negocio.logoUrl);
  }
}
