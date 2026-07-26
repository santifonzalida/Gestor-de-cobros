import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClasesService } from '../../clases/servicios/clases.service';
import { Alumno } from '../modelo/alumno.entity';
import { CrearAlumnoDto } from '../dtos/crear-alumno.dto';
import { ActualizarAlumnoDto } from '../dtos/actualizar-alumno.dto';

@Injectable()
export class AlumnosService {
  constructor(
    @InjectRepository(Alumno)
    private readonly repo: Repository<Alumno>,
    private readonly clasesService: ClasesService,
  ) {}

  async crear(dto: CrearAlumnoDto, negocioId: number): Promise<Alumno> {
    const { claseId, ...resto } = dto;
    if (claseId) {
      await this.clasesService.obtenerPorId(claseId, negocioId);
    }

    const alumno = this.repo.create({
      ...resto,
      negocio: { id: negocioId },
      clase: claseId ? { id: claseId } : undefined,
      fechaAlta: new Date(),
      activo: true,
    });
    return this.repo.save(alumno);
  }

  async listarTodos(negocioId: number): Promise<Alumno[]> {
    return this.repo.find({
      where: { negocio: { id: negocioId } },
      relations: { clase: true, usuario: true },
      select: { usuario: { id: true } },
      order: { id: 'ASC' },
    });
  }

  async listarPorClase(claseId: number, negocioId: number): Promise<Alumno[]> {
    return this.repo.find({
      where: { clase: { id: claseId }, negocio: { id: negocioId } },
      order: { id: 'ASC' },
    });
  }

  async obtenerPorId(id: number, negocioId: number): Promise<Alumno> {
    const alumno = await this.repo.findOne({
      where: { id, negocio: { id: negocioId } },
      relations: { clase: true, usuario: true },
      select: { usuario: { id: true } },
    });
    if (!alumno) {
      throw new NotFoundException('No se encontró el alumno.');
    }
    return alumno;
  }

  async vincularUsuario(alumnoId: number, usuarioId: number, negocioId: number): Promise<void> {
    const alumno = await this.obtenerPorId(alumnoId, negocioId);
    if (alumno.usuario) {
      throw new BadRequestException('Este alumno ya tiene un usuario vinculado.');
    }
    alumno.usuario = { id: usuarioId } as Alumno['usuario'];
    await this.repo.save(alumno);
  }

  async actualizar(id: number, dto: ActualizarAlumnoDto, negocioId: number): Promise<Alumno> {
    const alumno = await this.obtenerPorId(id, negocioId);
    const { claseId, ...resto } = dto;

    if (claseId) {
      await this.clasesService.obtenerPorId(claseId, negocioId);
      alumno.clase = { id: claseId } as Alumno['clase'];
    }
    Object.assign(alumno, resto);
    return this.repo.save(alumno);
  }

  async eliminar(id: number, negocioId: number): Promise<{ message: string }> {
    await this.obtenerPorId(id, negocioId);
    await this.repo.delete(id);
    return { message: 'Alumno eliminado exitosamente.' };
  }
}
