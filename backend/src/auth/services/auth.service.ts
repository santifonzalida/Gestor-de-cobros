import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol } from '../../usuarios/modelo/rol.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UsuarioService } from '../../usuarios/servicios/usuarios.service';
import { RegistrarUsuarioDto } from '../dtos/registrarUsuarioDto';
import { Usuario } from '../../usuarios/modelo/usuario.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsuarioService,
    private jwtService: JwtService,
    @InjectRepository(Rol) private readonly repo: Repository<Rol>,
  ) {}

  async register(dto: RegistrarUsuarioDto, negocioId: number) {
    const roleName = dto.roleName ?? 'USER';
    const role = await this.usersService.findByName(roleName);
    if (!role) throw new BadRequestException(`El rol '${roleName}' no existe.`);

    const user = await this.usersService.create(
      dto.email,
      dto.password,
      negocioId,
    );
    user.roles = [role];
    await this.usersService.save(user);
    return user;
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (user == null || !user.password) throw new UnauthorizedException();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException();

    return user;
  }

  async login(user: Usuario) {
    if (!user.negocio) {
      throw new UnauthorizedException('El usuario no tiene un negocio asignado.');
    }

    await this.usersService.updateLastLogin(user.id);

    const permissions = user.roles
      .flatMap((role) => role.permisos)
      .map((permiso) => permiso.nombre);

    const uniquePermissions = [...new Set(permissions)];

    const rolesSimplificados = user.roles.map((rol) => ({
      id: rol.id,
      name: rol.nombre,
    }));

    const payload = {
      sub: user.id,
      email: user.email,
      negocioId: user.negocio.id,
      roles: rolesSimplificados,
      permissions: uniquePermissions,
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async findRolByName(nombre: string) {
    return this.repo.findOne({ where: { nombre } });
  }
}
