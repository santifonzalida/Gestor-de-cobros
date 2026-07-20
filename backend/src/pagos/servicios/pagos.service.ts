import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { CuotasService } from '../../cuotas/servicios/cuotas.service';
import { EstadoCuota } from '../../cuotas/modelo/estado-cuota.enum';
import { ActualizarPagoDto } from '../dtos/actualizar-pago.dto';
import { CrearPagoDto } from '../dtos/crear-pago.dto';
import { FiltrarPagosDto } from '../dtos/filtrar-pagos.dto';
import { Pago } from '../modelo/pago.entity';

@Injectable()
export class PagosService {
  constructor(
    @InjectRepository(Pago)
    private readonly repo: Repository<Pago>,
    private readonly cuotasService: CuotasService,
  ) {}

  private async verificarCuotaSinPago(cuotaId: number, pagoIdAIgnorar?: number): Promise<void> {
    const existente = await this.repo.findOne({ where: { cuota: { id: cuotaId } } });
    if (existente && existente.id !== pagoIdAIgnorar) {
      throw new BadRequestException('Esta cuota ya tiene un pago registrado.');
    }
  }

  async crear(dto: CrearPagoDto, registradoPorId?: number): Promise<Pago> {
    await this.cuotasService.obtenerPorId(dto.cuotaId);
    await this.verificarCuotaSinPago(dto.cuotaId);

    const pago = this.repo.create({
      cuota: { id: dto.cuotaId },
      metodo: dto.metodo,
      montoPagado: dto.montoPagado,
      fechaPago: new Date(dto.fechaPago),
      comprobanteUrl: dto.comprobanteUrl,
      registradoPor: registradoPorId ? { id: registradoPorId } : undefined,
    });
    const guardado = await this.repo.save(pago);

    await this.cuotasService.actualizar(dto.cuotaId, { estado: EstadoCuota.PAGADA });

    return guardado;
  }

  async listarTodos(filtros: FiltrarPagosDto): Promise<Pago[]> {
    const where: FindOptionsWhere<Pago> = {};
    if (filtros.cuotaId) where.cuota = { id: filtros.cuotaId };
    if (filtros.metodo) where.metodo = filtros.metodo;

    return this.repo.find({
      where,
      relations: { cuota: true, registradoPor: true },
      select: { registradoPor: { id: true, email: true } },
      order: { fechaPago: 'DESC' },
    });
  }

  async obtenerPorId(id: number): Promise<Pago> {
    const pago = await this.repo.findOne({
      where: { id },
      relations: { cuota: true, registradoPor: true },
      select: { registradoPor: { id: true, email: true } },
    });
    if (!pago) {
      throw new NotFoundException('No se encontró el pago.');
    }
    return pago;
  }

  async actualizar(id: number, dto: ActualizarPagoDto): Promise<Pago> {
    const pago = await this.obtenerPorId(id);

    if (dto.cuotaId && dto.cuotaId !== pago.cuota.id) {
      await this.cuotasService.obtenerPorId(dto.cuotaId);
      await this.verificarCuotaSinPago(dto.cuotaId, pago.id);
      pago.cuota = { id: dto.cuotaId } as Pago['cuota'];
    }
    if (dto.metodo !== undefined) pago.metodo = dto.metodo;
    if (dto.montoPagado !== undefined) pago.montoPagado = dto.montoPagado;
    if (dto.fechaPago !== undefined) pago.fechaPago = new Date(dto.fechaPago);
    if (dto.comprobanteUrl !== undefined) pago.comprobanteUrl = dto.comprobanteUrl;

    return this.repo.save(pago);
  }

  async eliminar(id: number): Promise<{ message: string }> {
    const pago = await this.obtenerPorId(id);
    if (pago.cuota) {
      await this.cuotasService.desvincularPago(pago.cuota.id);
    }
    await this.repo.delete(id);
    return { message: 'Pago eliminado exitosamente.' };
  }
}
