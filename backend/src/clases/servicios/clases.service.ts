import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActualizarClaseDto } from '../dtos/actualizar-clase.dto';
import { CrearClaseDto } from '../dtos/crear-clase.dto';
import { Clase } from '../modelo/clase.entity';

@Injectable()
export class ClasesService {
  constructor(
    @InjectRepository(Clase)
    private readonly repo: Repository<Clase>,
  ) {}

  async crear(dto: CrearClaseDto, negocioId: number): Promise<Clase> {
    const clase = this.repo.create({ ...dto, negocio: { id: negocioId } });
    return this.repo.save(clase);
  }

  async listarTodos(negocioId: number): Promise<Clase[]> {
    return this.repo.find({ where: { negocio: { id: negocioId } }, order: { id: 'ASC' } });
  }

  async obtenerPorId(id: number, negocioId: number): Promise<Clase> {
    const clase = await this.repo.findOne({ where: { id, negocio: { id: negocioId } } });
    if (!clase) {
      throw new NotFoundException('No se encontró la clase.');
    }
    return clase;
  }

  async actualizar(id: number, dto: ActualizarClaseDto, negocioId: number): Promise<Clase> {
    const clase = await this.obtenerPorId(id, negocioId);
    Object.assign(clase, dto);
    return this.repo.save(clase);
  }

  async eliminar(id: number, negocioId: number): Promise<{ message: string }> {
    await this.obtenerPorId(id, negocioId);
    await this.repo.delete(id);
    return { message: 'Clase eliminada exitosamente.' };
  }
}