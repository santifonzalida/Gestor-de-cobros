import { Body, Controller, Delete, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ActualizarColorDto } from '../dtos/actualizar-color.dto';
import { ActualizarPerfilDto } from '../dtos/actualizar-perfil.dto';
import { UsuarioService } from '../servicios/usuarios.service';

@ApiTags('Usuarios')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Get('mi-perfil')
  @ApiOperation({ summary: 'Nombre, apellido y email de la sesión actual' })
  obtenerPerfil(@Req() request: { user: { sub: number } }) {
    return this.usuarioService.obtenerPerfil(request.user.sub);
  }

  @Patch('mi-perfil')
  @ApiOperation({ summary: 'Editar el nombre y apellido de la sesión actual' })
  actualizarPerfil(@Body() dto: ActualizarPerfilDto, @Req() request: { user: { sub: number } }) {
    return this.usuarioService.actualizarPerfil(request.user.sub, dto.nombre, dto.apellido);
  }

  @Get('mi-color')
  @ApiOperation({ summary: 'Color de acento personalizado de la sesión actual (null si usa el default)' })
  obtenerColor(@Req() request: { user: { sub: number } }) {
    return this.usuarioService.obtenerColorAccento(request.user.sub);
  }

  @Patch('mi-color')
  @ApiOperation({ summary: 'Elegir un color de acento personalizado para la sesión actual' })
  actualizarColor(@Body() dto: ActualizarColorDto, @Req() request: { user: { sub: number } }) {
    return this.usuarioService.actualizarColorAccento(request.user.sub, dto.colorAccento);
  }

  @Delete('mi-color')
  @ApiOperation({ summary: 'Volver a usar el color por defecto' })
  eliminarColor(@Req() request: { user: { sub: number } }) {
    return this.usuarioService.eliminarColorAccento(request.user.sub);
  }
}
