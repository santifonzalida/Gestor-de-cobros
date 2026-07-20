import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { AlumnosService } from '../../alumnos/servicios/alumnos.service';
import { ActualizarCuotaDto } from '../dtos/actualizar-cuota.dto';
import { CrearCuotaDto } from '../dtos/crear-cuota.dto';
import { FiltrarCuotasDto } from '../dtos/filtrar-cuotas.dto';
import { Cuota } from '../modelo/cuota.entity';
import { EstadoCuota } from '../modelo/estado-cuota.enum';

@Injectable()
export class CuotasService {
  constructor(
    @InjectRepository(Cuota)
    private readonly repo: Repository<Cuota>,
    private readonly alumnosService: AlumnosService,
  ) {}

  async crear(dto: CrearCuotaDto): Promise<Cuota> {
    await this.alumnosService.obtenerPorId(dto.alumnoId);

    const cuota = this.repo.create({
      alumno: { id: dto.alumnoId },
      mes: dto.mes,
      anio: dto.anio,
      monto: dto.monto,
      fechaVencimiento: new Date(dto.fechaVencimiento),
      estado: dto.estado ?? EstadoCuota.PENDIENTE,
    });
    return this.repo.save(cuota);
  }

  async listarTodos(filtros: FiltrarCuotasDto): Promise<Cuota[]> {
    const where: FindOptionsWhere<Cuota> = {};
    if (filtros.alumnoId) where.alumno = { id: filtros.alumnoId };
    if (filtros.estado) where.estado = filtros.estado;
    if (filtros.mes) where.mes = filtros.mes;
    if (filtros.anio) where.anio = filtros.anio;

    return this.repo.find({
      where,
      relations: { alumno: true },
      order: { anio: 'DESC', mes: 'DESC' },
    });
  }

  async obtenerPorId(id: number): Promise<Cuota> {
    const cuota = await this.repo.findOne({ where: { id }, relations: { alumno: true } });
    if (!cuota) {
      throw new NotFoundException('No se encontró la cuota.');
    }
    return cuota;
  }

  async actualizar(id: number, dto: ActualizarCuotaDto): Promise<Cuota> {
    const cuota = await this.obtenerPorId(id);

    if (dto.alumnoId) {
      await this.alumnosService.obtenerPorId(dto.alumnoId);
      cuota.alumno = { id: dto.alumnoId } as Cuota['alumno'];
    }
    if (dto.mes !== undefined) cuota.mes = dto.mes;
    if (dto.anio !== undefined) cuota.anio = dto.anio;
    if (dto.monto !== undefined) cuota.monto = dto.monto;
    if (dto.estado !== undefined) cuota.estado = dto.estado;
    if (dto.fechaVencimiento !== undefined) cuota.fechaVencimiento = new Date(dto.fechaVencimiento);

    return this.repo.save(cuota);
  }

  async eliminar(id: number): Promise<{ message: string }> {
    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('No se encontró la cuota.');
    }
    return { message: 'Cuota eliminada exitosamente.' };
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
