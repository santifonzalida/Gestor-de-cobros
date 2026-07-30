import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ArchivosService,
  ObjetoDescargado,
} from '../../archivos/servicios/archivos.service';
import { ConfirmarLogoDto } from '../dtos/confirmar-logo.dto';
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
    private readonly config: ConfigService,
  ) {}

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
