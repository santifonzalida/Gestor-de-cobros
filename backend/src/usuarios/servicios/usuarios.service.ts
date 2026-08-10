import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../modelo/usuario.entity';
import { Rol } from '../modelo/rol.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private readonly repoUsuarios: Repository<Usuario>,
    @InjectRepository(Rol)
    private readonly repoRoles: Repository<Rol>,
  ) {}

  async findAll(): Promise<Omit<Usuario, 'password'>[]> {
    const users = await this.repoUsuarios.find({
      order: { id: 'ASC' },
    });
    return users.map(({ password, ...rest }) => rest);
  }

  async create(
    email: string,
    password: string,
    negocioId: number,
    nombre?: string,
    apellido?: string,
  ) {
    const existingUser = await this.repoUsuarios.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('El correo electrónico ya está en uso.');
    }

    const hash = await bcrypt.hash(password, 10);

    const ahora = new Date();
    const user = this.repoUsuarios.create({
      email,
      password: hash,
      negocio: { id: negocioId },
      nombre,
      apellido,
      fechaAlta: ahora,
      fechaModificacion: ahora,
      ultimoAcceso: ahora,
    });

    return this.repoUsuarios.save(user);
  }

  async delete(id: number) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('No se encontro el usuario.');
    }
    const result = await this.repoUsuarios.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('No se encontro el usuario.');
    }
    return { message: 'Usuario eliminado exitosamente.' };
  }

  async save(user: Usuario) {
    return this.repoUsuarios.save(user);
  }

  async updateLastLogin(id: number) {
    await this.repoUsuarios
      .createQueryBuilder()
      .update('usuarios')
      .set({ ultimoAcceso: new Date() })
      .where('id = :id', { id })
      .execute();
  }

  async findById(id: number): Promise<Usuario> {
    if (!id || isNaN(Number(id))) {
      return;
    }
    const user = await this.repoUsuarios.findOne({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('No se encontro el usuario.');
    }
    return user;
  }

  async findByEmail(email: string) {
    const user = await this.repoUsuarios.findOne({
      where: { email },
      relations: { roles: { permisos: true }, negocio: true, alumno: true }, // Carga roles, permisos, negocio y alumno vinculado
    });
    if (!user) {
      return null;
    }
    return user;
  }

  async findByIdWithRelations(id: number) {
    const user = await this.repoUsuarios.findOne({
      where: { id },
      relations: { roles: { permisos: true } },
    });
    if (!user) {
      throw new NotFoundException('No se encontro el usuario.');
    }
    const { password, ...result } = user;
    return result;
  }

  async findByRol(rol: string) {
    const users = await this.repoUsuarios
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .where('role.name = :rol', { rol })
      .getMany();

    return users.map(({ password, ...rest }) => rest);
  }

  async findByRolWithoutUser(rol: string) {
    const users = await this.repoUsuarios
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .where('role.name = :rol', { rol })
      .getMany();

    return users.map(({ password, roles, ...rest }) => rest);
  }

  async findByEmailWithRolesAndPermissions(email: string) {
    return this.repoUsuarios.findOne({
      where: { email },
      relations: {
        roles: {
          permisos: true,
        },
      },
    });
  }

  async findByName(nombre: string) {
    return this.repoRoles.findOne({ where: { nombre } });
  }

  async obtenerPerfil(
    usuarioId: number,
  ): Promise<{ nombre: string | null; apellido: string | null; email: string }> {
    const usuario = await this.repoUsuarios.findOne({
      where: { id: usuarioId },
      select: { id: true, nombre: true, apellido: true, email: true },
    });
    if (!usuario) {
      throw new NotFoundException('No se encontro el usuario.');
    }
    return {
      nombre: usuario.nombre ?? null,
      apellido: usuario.apellido ?? null,
      email: usuario.email,
    };
  }

  async actualizarPerfil(
    usuarioId: number,
    nombre: string,
    apellido: string,
  ): Promise<{ nombre: string; apellido: string }> {
    await this.repoUsuarios
      .createQueryBuilder()
      .update(Usuario)
      .set({ nombre, apellido, fechaModificacion: new Date() })
      .where('id = :id', { id: usuarioId })
      .execute();
    return { nombre, apellido };
  }

  async cambiarPassword(
    usuarioId: number,
    passwordActual: string,
    passwordNueva: string,
  ): Promise<{ message: string }> {
    const usuario = await this.repoUsuarios.findOne({ where: { id: usuarioId } });
    if (!usuario) {
      throw new NotFoundException('No se encontro el usuario.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const coincide = await bcrypt.compare(passwordActual, usuario.password);
    if (!coincide) {
      throw new BadRequestException('La contraseña actual no es correcta.');
    }

    const hash = await bcrypt.hash(passwordNueva, 10);
    await this.repoUsuarios
      .createQueryBuilder()
      .update(Usuario)
      .set({ password: hash, fechaModificacion: new Date() })
      .where('id = :id', { id: usuarioId })
      .execute();

    return { message: 'Contraseña actualizada.' };
  }

  async obtenerColorAccento(usuarioId: number): Promise<{ colorAccento: string | null }> {
    const usuario = await this.repoUsuarios.findOne({
      where: { id: usuarioId },
      select: { id: true, colorAccento: true },
    });
    return { colorAccento: usuario?.colorAccento ?? null };
  }

  async actualizarColorAccento(usuarioId: number, color: string): Promise<{ colorAccento: string }> {
    await this.repoUsuarios
      .createQueryBuilder()
      .update(Usuario)
      .set({ colorAccento: color })
      .where('id = :id', { id: usuarioId })
      .execute();
    return { colorAccento: color };
  }

  async eliminarColorAccento(usuarioId: number): Promise<{ colorAccento: null }> {
    await this.repoUsuarios
      .createQueryBuilder()
      .update(Usuario)
      .set({ colorAccento: null })
      .where('id = :id', { id: usuarioId })
      .execute();
    return { colorAccento: null };
  }
}
