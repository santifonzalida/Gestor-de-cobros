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
import { ConfigService } from '@nestjs/config';
import { UsuarioService } from '../../usuarios/servicios/usuarios.service';
import { AlumnosService } from '../../alumnos/servicios/alumnos.service';
import { NegociosService } from '../../negocios/servicios/negocios.service';
import { RegistrarUsuarioDto } from '../dtos/registrarUsuarioDto';
import { Usuario } from '../../usuarios/modelo/usuario.entity';
import { EmailService } from './email.service';

interface PayloadInvitacionAlumno {
  tipo: 'invitacion_alumno';
  alumnoId: number;
  negocioId: number;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsuarioService,
    private alumnosService: AlumnosService,
    private negociosService: NegociosService,
    private emailService: EmailService,
    private jwtService: JwtService,
    private config: ConfigService,
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
      dto.nombre,
      dto.apellido,
    );
    user.roles = [role];
    await this.usersService.save(user);
    return user;
  }

  async generarInvitacion(
    alumnoId: number,
    negocioId: number,
  ): Promise<{ message: string }> {
    const alumno = await this.alumnosService.obtenerPorId(alumnoId, negocioId);
    if (!alumno.email) {
      throw new BadRequestException('El alumno no tiene un email cargado.');
    }
    if (alumno.usuario) {
      throw new BadRequestException(
        'Este alumno ya tiene un usuario vinculado.',
      );
    }

    const payload: PayloadInvitacionAlumno = {
      tipo: 'invitacion_alumno',
      alumnoId,
      negocioId,
      email: alumno.email,
    };
    const token = this.jwtService.sign(payload, { expiresIn: '48h' });
    const frontendUrl = this.config.get<string>('FRONTEND_URL');
    const link = `${frontendUrl}/completar-registro?token=${token}`;

    const { logoUrl } =
      await this.negociosService.obtenerActualConLogo(negocioId);
    await this.emailService.enviarInvitacionAlumno(
      alumno.email,
      alumno.nombre,
      link,
      logoUrl ?? undefined,
    );
    return { message: 'Invitación enviada.' };
  }

  async completarInvitacion(
    token: string,
    password: string,
  ): Promise<{ message: string }> {
    let payload: PayloadInvitacionAlumno;
    try {
      payload = this.jwtService.verify<PayloadInvitacionAlumno>(token);
    } catch {
      throw new BadRequestException(
        'El link de invitación no es válido o venció.',
      );
    }
    if (payload.tipo !== 'invitacion_alumno') {
      throw new BadRequestException('El link de invitación no es válido.');
    }

    const alumno = await this.alumnosService.obtenerPorId(
      payload.alumnoId,
      payload.negocioId,
    );
    if (alumno.usuario) {
      throw new BadRequestException(
        'Este alumno ya tiene un usuario vinculado.',
      );
    }

    const role = await this.usersService.findByName('ALUMNO');
    if (!role) throw new BadRequestException(`El rol 'ALUMNO' no existe.`);

    const user = await this.usersService.create(
      alumno.email,
      password,
      payload.negocioId,
    );
    user.roles = [role];
    await this.usersService.save(user);

    await this.alumnosService.vincularUsuario(
      alumno.id,
      user.id,
      payload.negocioId,
    );
    return { message: 'Cuenta creada exitosamente.' };
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
      throw new UnauthorizedException(
        'El usuario no tiene un negocio asignado.',
      );
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
      alumnoId: user.alumno?.id ?? null,
      roles: rolesSimplificados,
      permissions: uniquePermissions,
    };

    const esAlumno = rolesSimplificados.some((rol) => rol.name === 'ALUMNO');

    return {
      accessToken: this.jwtService.sign(payload),
      ruta: esAlumno ? '/portal' : '/dashboard',
    };
  }

  async findRolByName(nombre: string) {
    return this.repo.findOne({ where: { nombre } });
  }
}
