import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClasesService } from '../../clases/servicios/clases.service';
import { CuotaResumen, CuotasService } from '../../cuotas/servicios/cuotas.service';
import { EstadoPago } from '../../cuotas/modelo/estado-pago.type';
import { Alumno } from '../modelo/alumno.entity';
import { CrearAlumnoDto } from '../dtos/crear-alumno.dto';
import { ActualizarAlumnoDto } from '../dtos/actualizar-alumno.dto';

export interface AlumnoConEstado extends Alumno {
  estadoPago: EstadoPago;
  cuotaActual?: CuotaResumen;
}

@Injectable()
export class AlumnosService {
  constructor(
    @InjectRepository(Alumno)
    private readonly repo: Repository<Alumno>,
    private readonly clasesService: ClasesService,
    @Inject(forwardRef(() => CuotasService))
    private readonly cuotasService: CuotasService,
  ) {}

  async crear(dto: CrearAlumnoDto, negocioId: number): Promise<Alumno> {
    const { claseId, ...resto } = dto;
    if (claseId) {
      await this.clasesService.obtenerPorId(claseId, negocioId);
    }

    const alumno = this.repo.create({
      ...resto,
      email: resto.email?.toLowerCase(),
      negocio: { id: negocioId },
      clase: claseId ? { id: claseId } : undefined,
      fechaAlta: new Date(),
      activo: true,
    });
    const guardado = await this.repo.save(alumno);

    if (claseId) {
      await this.cuotasService.crearParaNuevoAlumno(guardado.id, claseId, negocioId);
    }

    return this.obtenerPorIdConEstado(guardado.id, negocioId);
  }

  async listarTodos(negocioId: number, alumnoIdSesion?: number | null): Promise<AlumnoConEstado[]> {
    const alumnos = await this.repo.find({
      where: {
        negocio: { id: negocioId },
        ...(alumnoIdSesion != null ? { id: alumnoIdSesion } : {}),
      },
      relations: { clase: true, usuario: true },
      select: { usuario: { id: true } },
      order: { id: 'ASC' },
    });
    return this.enriquecerConEstado(alumnos, negocioId);
  }

  /**
   * Calcula `cuotaActual`/`estadoPago` de cada alumno en una sola consulta de
   * cuotas (`CuotasService.listarPorAlumnos`), en vez del N+1 que antes hacía
   * el frontend (un GET /cuotas por alumno). No se persiste nada — se
   * recalcula en cada request, así que nunca puede quedar desactualizado.
   */
  private async enriquecerConEstado(alumnos: Alumno[], negocioId: number): Promise<AlumnoConEstado[]> {
    if (alumnos.length === 0) return [];

    const cuotas = await this.cuotasService.listarPorAlumnos(
      alumnos.map((a) => a.id),
      negocioId,
    );
    const cuotasPorAlumno = new Map<number, typeof cuotas>();
    for (const cuota of cuotas) {
      const lista = cuotasPorAlumno.get(cuota.alumno.id) ?? [];
      lista.push(cuota);
      cuotasPorAlumno.set(cuota.alumno.id, lista);
    }

    return alumnos.map((alumno) => {
      const cuotasDelAlumno = cuotasPorAlumno.get(alumno.id) ?? [];
      const cuotaActualCruda = this.cuotasService.seleccionarCuotaActual(cuotasDelAlumno);
      return {
        ...alumno,
        cuotaActual: cuotaActualCruda ? this.cuotasService.resumir(cuotaActualCruda) : undefined,
        estadoPago: this.cuotasService.calcularEstadoPago(cuotaActualCruda),
      };
    });
  }

  async obtenerPorIdConEstado(
    id: number,
    negocioId: number,
    alumnoIdSesion?: number | null,
  ): Promise<AlumnoConEstado> {
    const alumno = await this.obtenerPorId(id, negocioId, alumnoIdSesion);
    return (await this.enriquecerConEstado([alumno], negocioId))[0];
  }

  async listarPorClase(claseId: number, negocioId: number): Promise<Alumno[]> {
    return this.repo.find({
      where: { clase: { id: claseId }, negocio: { id: negocioId } },
      order: { id: 'ASC' },
    });
  }

  async obtenerPorId(id: number, negocioId: number, alumnoIdSesion?: number | null): Promise<Alumno> {
    const alumno = await this.repo.findOne({
      where: { id, negocio: { id: negocioId } },
      relations: { clase: true, usuario: true },
      select: { usuario: { id: true } },
    });
    if (!alumno || (alumnoIdSesion != null && alumno.id !== alumnoIdSesion)) {
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

  async actualizar(id: number, dto: ActualizarAlumnoDto, negocioId: number): Promise<AlumnoConEstado> {
    const alumno = await this.obtenerPorId(id, negocioId);
    const { claseId, ...resto } = dto;

    if (claseId) {
      await this.clasesService.obtenerPorId(claseId, negocioId);
      alumno.clase = { id: claseId } as Alumno['clase'];
    }
    if (resto.email !== undefined) {
      resto.email = resto.email?.toLowerCase();
    }
    Object.assign(alumno, resto);
    await this.repo.save(alumno);
    return this.obtenerPorIdConEstado(id, negocioId);
  }

  async eliminar(id: number, negocioId: number): Promise<{ message: string }> {
    const alumno = await this.obtenerPorId(id, negocioId);
    if (alumno.activo) {
      throw new BadRequestException(
        'Solo se puede eliminar definitivamente a un alumno que ya esté dado de baja.',
      );
    }
    if (await this.cuotasService.tieneCuotasDeAlumno(id, negocioId)) {
      throw new BadRequestException(
        'No se puede eliminar un alumno con cuotas cargadas.',
      );
    }
    await this.repo.delete(id);
    return { message: 'Alumno eliminado exitosamente.' };
  }
}
