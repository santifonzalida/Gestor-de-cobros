import {
  Controller,
  Body,
  Post,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { RegistrarUsuarioDto } from '../dtos/registrarUsuarioDto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @ApiBearerAuth()
  @Roles('ADMIN')
  @Post('register')
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente' })
  @ApiResponse({
    status: 400,
    description: 'Email ya está en uso o rol inválido',
  })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  register(@Body() dto: RegistrarUsuarioDto) {
    return this.authService.register(dto);
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 200, description: 'Inicio de sesión exitoso' })
  @ApiResponse({
    status: 400,
    description: 'Error al iniciar sesión. Verifica tus credenciales.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        password: { type: 'string', example: 'password123' },
        nombre: { type: 'string', example: 'Juan Pérez' },
        apellido: { type: 'string', example: 'García' },
      },
    },
  })
  async login(@Request() req) {
    const user = await this.authService.validateUser(
      req.body.email,
      req.body.password,
    );
    const loginResponse = await this.authService.login(user);
    return {
      ruta: '/dashboard',
      codigoHttp: HttpStatus.OK,
      exito: true,
      mensaje: 'Inicio de sesión exitoso',
      ...loginResponse,
    };
  }
}
