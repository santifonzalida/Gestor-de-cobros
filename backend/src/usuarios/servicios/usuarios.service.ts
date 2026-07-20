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

  async create(email: string, password: string) {
    const existingUser = await this.repoUsuarios.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('El correo electrónico ya está en uso.');
    }

    const hash = await bcrypt.hash(password, 10);

    const user = this.repoUsuarios.create({
      email,
      password: hash,
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
      relations: { roles: { permisos: true } }, // Carga roles y permisos asociados
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
}
