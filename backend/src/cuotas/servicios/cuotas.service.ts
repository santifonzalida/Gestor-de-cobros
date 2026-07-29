import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { AlumnosService } from '../../alumnos/servicios/alumnos.service';
import { ClasesService } from '../../clases/servicios/clases.service';
import { ArchivosService } from '../../archivos/servicios/archivos.service';
import { PagosService } from '../../pagos/servicios/pagos.service';
import { Pago } from '../../pagos/modelo/pago.entity';
import { ActualizarCuotaDto } from '../dtos/actualizar-cuota.dto';
import { CrearCuotaDto } from '../dtos/crear-cuota.dto';
import { CrearCuotaPorClaseDto } from '../dtos/crear-cuota-por-clase.dto';
import { FiltrarCuotasDto } from '../dtos/filtrar-cuotas.dto';
import { SolicitarSubidaComprobanteDto } from '../dtos/solicitar-subida-comprobante.dto';
import { ConfirmarComprobanteDto } from '../dtos/confirmar-comprobante.dto';
import { AprobarComprobanteDto } from '../dtos/aprobar-comprobante.dto';
import { Cuota } from '../modelo/cuota.entity';
import { EstadoCuota } from '../modelo/estado-cuota.enum';

export interface ResultadoAltaPorClase {
  creadas: number;
  omitidas: number;
}

@Injectable()
export class CuotasService {
  constructor(
    @InjectRepository(Cuota)
    private readonly repo: Repository<Cuota>,
    @Inject(forwardRef(() => AlumnosService))
    private readonly alumnosService: AlumnosService,
    private readonly clasesService: ClasesService,
    @Inject(forwardRef(() => PagosService))
    private readonly pagosService: PagosService,
    private readonly archivosService: ArchivosService,
  ) {}

  private async existeDuplicado(
    alumnoId: number,
    mes: number,
    anio: number,
    cuotaIdAIgnorar?: number,
  ): Promise<boolean> {
    const existente = await this.repo.findOne({
      where: { alumno: { id: alumnoId }, mes, anio },
    });
    return !!existente && existente.id !== cuotaIdAIgnorar;
  }

  private async verificarSinDuplicado(
    alumnoId: number,
    mes: number,
    anio: number,
    cuotaIdAIgnorar?: number,
  ): Promise<void> {
    if (await this.existeDuplicado(alumnoId, mes, anio, cuotaIdAIgnorar)) {
      throw new BadRequestException('Ya existe una cuota para ese alumno en ese mes/año.');
    }
  }

  async crear(dto: CrearCuotaDto, negocioId: number): Promise<Cuota> {
    await this.alumnosService.obtenerPorId(dto.alumnoId, negocioId);
    await this.verificarSinDuplicado(dto.alumnoId, dto.mes, dto.anio);

    const cuota = this.repo.create({
      negocio: { id: negocioId },
      alumno: { id: dto.alumnoId },
      mes: dto.mes,
      anio: dto.anio,
      monto: dto.monto,
      fechaVencimiento: new Date(dto.fechaVencimiento),
      estado: dto.estado ?? EstadoCuota.PENDIENTE,
    });
    return this.repo.save(cuota);
  }

  async crearPorClase(dto: CrearCuotaPorClaseDto, negocioId: number): Promise<ResultadoAltaPorClase> {
    await this.clasesService.obtenerPorId(dto.claseId, negocioId);
    const alumnos = await this.alumnosService.listarPorClase(dto.claseId, negocioId);

    let creadas = 0;
    let omitidas = 0;

    for (const alumno of alumnos) {
      if (await this.existeDuplicado(alumno.id, dto.mes, dto.anio)) {
        omitidas++;
        continue;
      }

      const cuota = this.repo.create({
        negocio: { id: negocioId },
        alumno: { id: alumno.id },
        mes: dto.mes,
        anio: dto.anio,
        monto: dto.monto,
        fechaVencimiento: new Date(dto.fechaVencimiento),
        estado: EstadoCuota.PENDIENTE,
      });
      await this.repo.save(cuota);
      creadas++;
    }

    return { creadas, omitidas };
  }

  async obtenerUltimaCuotaDeClase(claseId: number, negocioId: number): Promise<Cuota | undefined> {
    const cuota = await this.repo.findOne({
      where: { negocio: { id: negocioId }, alumno: { clase: { id: claseId } } },
      order: { anio: 'DESC', mes: 'DESC' },
    });
    return cuota ?? undefined;
  }

  /**
   * Al crear un alumno en una clase que ya tiene una cuota cargada (ej. vía
   * "crear cuotas por clase"), se le clona la más reciente para que no quede
   * afuera del cobro del período en curso.
   */
  async crearParaNuevoAlumno(alumnoId: number, claseId: number, negocioId: number): Promise<void> {
    const ultima = await this.obtenerUltimaCuotaDeClase(claseId, negocioId);
    if (!ultima) return;

    const cuota = this.repo.create({
      negocio: { id: negocioId },
      alumno: { id: alumnoId },
      mes: ultima.mes,
      anio: ultima.anio,
      monto: ultima.monto,
      fechaVencimiento: ultima.fechaVencimiento,
      estado: EstadoCuota.PENDIENTE,
    });
    await this.repo.save(cuota);
  }

  async listarTodos(
    filtros: FiltrarCuotasDto,
    negocioId: number,
    alumnoIdSesion?: number | null,
  ): Promise<Cuota[]> {
    const where: FindOptionsWhere<Cuota> = { negocio: { id: negocioId } };
    if (filtros.alumnoId) where.alumno = { id: filtros.alumnoId };
    if (filtros.claseId) {
      where.alumno = filtros.alumnoId
        ? { id: filtros.alumnoId, clase: { id: filtros.claseId } }
        : { clase: { id: filtros.claseId } };
    }
    if (filtros.estado) where.estado = filtros.estado;
    if (filtros.mes) where.mes = filtros.mes;
    if (filtros.anio) where.anio = filtros.anio;
    if (alumnoIdSesion != null) where.alumno = { id: alumnoIdSesion };

    return this.repo.find({
      where,
      relations: { alumno: true },
      order: { anio: 'DESC', mes: 'DESC' },
    });
  }

  async obtenerPorId(id: number, negocioId: number, alumnoIdSesion?: number | null): Promise<Cuota> {
    const cuota = await this.repo.findOne({
      where: { id, negocio: { id: negocioId } },
      relations: { alumno: true },
    });
    if (!cuota || (alumnoIdSesion != null && cuota.alumno.id !== alumnoIdSesion)) {
      throw new NotFoundException('No se encontró la cuota.');
    }
    return cuota;
  }

  async actualizar(id: number, dto: ActualizarCuotaDto, negocioId: number): Promise<Cuota> {
    const cuota = await this.obtenerPorId(id, negocioId);

    if (dto.alumnoId) {
      await this.alumnosService.obtenerPorId(dto.alumnoId, negocioId);
    }
    const alumnoId = dto.alumnoId ?? cuota.alumno.id;
    const mes = dto.mes ?? cuota.mes;
    const anio = dto.anio ?? cuota.anio;
    if (dto.alumnoId !== undefined || dto.mes !== undefined || dto.anio !== undefined) {
      await this.verificarSinDuplicado(alumnoId, mes, anio, cuota.id);
    }

    if (dto.alumnoId) cuota.alumno = { id: dto.alumnoId } as Cuota['alumno'];
    if (dto.mes !== undefined) cuota.mes = dto.mes;
    if (dto.anio !== undefined) cuota.anio = dto.anio;
    if (dto.monto !== undefined) cuota.monto = dto.monto;
    if (dto.estado !== undefined) cuota.estado = dto.estado;
    if (dto.fechaVencimiento !== undefined) cuota.fechaVencimiento = new Date(dto.fechaVencimiento);

    return this.repo.save(cuota);
  }

  async eliminar(id: number, negocioId: number): Promise<{ message: string }> {
    await this.obtenerPorId(id, negocioId);
    await this.repo.delete(id);
    return { message: 'Cuota eliminada exitosamente.' };
  }

  async solicitarSubidaComprobante(
    id: number,
    dto: SolicitarSubidaComprobanteDto,
    negocioId: number,
    alumnoIdSesion: number | null,
  ): Promise<{ url: string; key: string }> {
    await this.obtenerPorId(id, negocioId, alumnoIdSesion);
    const key = `comprobantes/${negocioId}/${id}/${Date.now()}-${dto.nombreArchivo}`;
    const url = await this.archivosService.generarUrlSubida(key, dto.contentType);
    return { url, key };
  }

  async confirmarComprobante(
    id: number,
    dto: ConfirmarComprobanteDto,
    negocioId: number,
    alumnoIdSesion: number | null,
  ): Promise<Cuota> {
    const cuota = await this.obtenerPorId(id, negocioId, alumnoIdSesion);
    const existe = await this.archivosService.existe(dto.key);
    if (!existe) {
      throw new BadRequestException('El archivo todavía no llegó al almacenamiento. Probá de nuevo.');
    }
    cuota.comprobanteUrl = dto.key;
    cuota.estado = EstadoCuota.EN_REVISION;
    return this.repo.save(cuota);
  }

  async obtenerUrlComprobante(
    id: number,
    negocioId: number,
    alumnoIdSesion: number | null,
  ): Promise<{ url: string }> {
    const cuota = await this.obtenerPorId(id, negocioId, alumnoIdSesion);
    if (!cuota.comprobanteUrl) {
      throw new NotFoundException('Esta cuota no tiene ningún comprobante cargado.');
    }
    const url = await this.archivosService.generarUrlDescarga(cuota.comprobanteUrl);
    return { url };
  }

  async aprobarComprobante(
    id: number,
    dto: AprobarComprobanteDto,
    negocioId: number,
    adminId?: number,
  ): Promise<Pago> {
    const cuota = await this.obtenerPorId(id, negocioId);
    if (cuota.estado !== EstadoCuota.EN_REVISION || !cuota.comprobanteUrl) {
      throw new BadRequestException('Esta cuota no tiene ningún comprobante en revisión.');
    }
    return this.pagosService.crear(
      {
        cuotaId: id,
        metodo: dto.metodo,
        montoPagado: dto.montoPagado ?? cuota.monto,
        fechaPago: new Date().toISOString(),
        comprobanteUrl: cuota.comprobanteUrl,
      },
      negocioId,
      adminId,
    );
  }

  async rechazarComprobante(id: number, negocioId: number): Promise<Cuota> {
    const cuota = await this.obtenerPorId(id, negocioId);
    if (cuota.estado !== EstadoCuota.EN_REVISION) {
      throw new BadRequestException('Esta cuota no tiene ningún comprobante en revisión.');
    }
    await this.repo
      .createQueryBuilder()
      .update(Cuota)
      .set({ comprobanteUrl: null, estado: EstadoCuota.PENDIENTE })
      .where('id = :id', { id })
      .execute();
    return this.obtenerPorId(id, negocioId);
  }

  /**
   * La FK del OneToOne cuota-pago vive del lado de `cuota` (@JoinColumn),
   * así que hay que limpiar esa referencia antes de poder borrar el pago.
   */
  async desvincularPago(cuotaId: number): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update(Cuota)
      .set({ pago: null, estado: EstadoCuota.PENDIENTE })
      .where('id = :id', { id: cuotaId })
      .execute();
  }
}
