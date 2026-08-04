import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { ArchivosService } from '../../archivos/servicios/archivos.service';
import { Cuota } from '../../cuotas/modelo/cuota.entity';
import { FiltrarComprobantesDto } from '../dtos/filtrar-comprobantes.dto';
import { Comprobante } from '../modelo/comprobante.entity';
import { EstadoComprobante } from '../modelo/estado-comprobante.enum';

@Injectable()
export class ComprobantesService {
  constructor(
    @InjectRepository(Comprobante)
    private readonly repo: Repository<Comprobante>,
    @InjectRepository(Cuota)
    private readonly cuotaRepo: Repository<Cuota>,
    private readonly archivosService: ArchivosService,
  ) {}

  async registrarCarga(cuotaId: number, negocioId: number, key: string): Promise<Comprobante> {
    const comprobante = this.repo.create({
      negocio: { id: negocioId },
      cuota: { id: cuotaId },
      key,
      estado: EstadoComprobante.EN_REVISION,
      fechaCarga: new Date(),
    });
    return this.repo.save(comprobante);
  }

  /**
   * Busca el intento EN_REVISION más reciente de la cuota y lo resuelve.
   * Si no encuentra ninguno (cuotas ya EN_REVISION antes de este cambio, o
   * un re-envío que dejó un intento anterior huérfano) inserta una fila ya
   * resuelta en el momento — aprobar/rechazar nunca se bloquea por esto.
   */
  async marcarRevisado(
    cuotaId: number,
    negocioId: number,
    estado: EstadoComprobante.APROBADO | EstadoComprobante.RECHAZADO,
    revisadoPorId?: number,
  ): Promise<Comprobante> {
    const pendiente = await this.repo.findOne({
      where: {
        cuota: { id: cuotaId },
        negocio: { id: negocioId },
        estado: EstadoComprobante.EN_REVISION,
      },
      order: { fechaCarga: 'DESC' },
    });

    const ahora = new Date();
    if (!pendiente) {
      // No hay un intento EN_REVISION registrado (cuota que ya estaba
      // EN_REVISION antes de este cambio, o un re-envío que dejó un intento
      // anterior huérfano) — se reconstruye la fila con la key que la Cuota
      // todavía tiene en este momento, en vez de bloquear la revisión real.
      const cuota = await this.cuotaRepo.findOne({ where: { id: cuotaId } });
      return this.repo.save(
        this.repo.create({
          negocio: { id: negocioId },
          cuota: { id: cuotaId },
          key: cuota?.comprobanteUrl ?? '',
          estado,
          fechaCarga: ahora,
          fechaRevision: ahora,
          revisadoPor: revisadoPorId ? { id: revisadoPorId } : undefined,
        }),
      );
    }

    pendiente.estado = estado;
    pendiente.fechaRevision = ahora;
    if (revisadoPorId) pendiente.revisadoPor = { id: revisadoPorId } as Comprobante['revisadoPor'];
    return this.repo.save(pendiente);
  }

  async tieneHistorial(cuotaId: number, negocioId: number): Promise<boolean> {
    const count = await this.repo.count({
      where: { cuota: { id: cuotaId }, negocio: { id: negocioId } },
    });
    return count > 0;
  }

  async listarTodos(filtros: FiltrarComprobantesDto, negocioId: number): Promise<Comprobante[]> {
    const where: FindOptionsWhere<Comprobante> = { negocio: { id: negocioId } };
    if (filtros.alumnoId) where.cuota = { alumno: { id: filtros.alumnoId } };
    if (filtros.claseId) {
      where.cuota = filtros.alumnoId
        ? { alumno: { id: filtros.alumnoId, clase: { id: filtros.claseId } } }
        : { alumno: { clase: { id: filtros.claseId } } };
    }
    if (filtros.estado) where.estado = filtros.estado;
    if (filtros.mes || filtros.anio) {
      where.cuota = {
        ...(typeof where.cuota === 'object' ? where.cuota : {}),
        ...(filtros.mes ? { mes: filtros.mes } : {}),
        ...(filtros.anio ? { anio: filtros.anio } : {}),
      };
    }

    return this.repo.find({
      where,
      relations: { cuota: { alumno: { clase: true } }, revisadoPor: true },
      select: { revisadoPor: { id: true, email: true } },
      order: { fechaCarga: 'DESC' },
    });
  }

  async obtenerUrlDescarga(id: number, negocioId: number): Promise<{ url: string }> {
    const comprobante = await this.repo.findOne({
      where: { id, negocio: { id: negocioId } },
    });
    if (!comprobante) {
      throw new NotFoundException('No se encontró el comprobante.');
    }
    const url = await this.archivosService.generarUrlDescarga(comprobante.key);
    return { url };
  }
}
