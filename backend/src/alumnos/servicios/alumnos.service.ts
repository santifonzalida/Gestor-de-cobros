import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alumno } from '../modelo/alumno.entity';
import { CrearAlumnoDto } from '../dtos/crear-alumno.dto';
import { ActualizarAlumnoDto } from '../dtos/actualizar-alumno.dto';

@Injectable()
export class AlumnosService {
  constructor(
    @InjectRepository(Alumno)
    private readonly repo: Repository<Alumno>,
  ) {}

  async crear(dto: CrearAlumnoDto): Promise<Alumno> {
    const alumno = this.repo.create({
      ...dto,
      fechaAlta: new Date(),
      activo: true,
    });
    return this.repo.save(alumno);
  }

  async listarTodos(): Promise<Alumno[]> {
    return this.repo.find({ order: { id: 'ASC' } });
  }

  async obtenerPorId(id: number): Promise<Alumno> {
    const alumno = await this.repo.findOne({ where: { id } });
    if (!alumno) {
      throw new NotFoundException('No se encontró el alumno.');
    }
    return alumno;
  }

  async actualizar(id: number, dto: ActualizarAlumnoDto): Promise<Alumno> {
    const alumno = await this.obtenerPorId(id);
    Object.assign(alumno, dto);
    return this.repo.save(alumno);
  }

  async eliminar(id: number): Promise<{ message: string }> {
    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('No se encontró el alumno.');
    }
    return { message: 'Alumno eliminado exitosamente.' };
  }
}
