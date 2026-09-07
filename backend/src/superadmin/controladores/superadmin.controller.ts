import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ApiKeyGuard } from '../../auth/guards/api-key.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CambiarEstadoNegocioDto } from '../dtos/cambiar-estado-negocio.dto';
import { CrearNegocioSuperadminDto } from '../dtos/crear-negocio-superadmin.dto';
import { CrearSuperadminDto } from '../dtos/crear-superadmin.dto';
import { InvitarAdminDto } from '../dtos/invitar-admin.dto';
import { SuperadminService } from '../servicios/superadmin.service';

@ApiTags('Superadmin')
@Controller('superadmin')
export class SuperadminController {
  constructor(private readonly superadminService: SuperadminService) {}

  @Post()
  @UseGuards(ApiKeyGuard)
  @ApiHeader({
    name: 'x-api-key',
    description: 'ADMIN_SETUP_KEY — sin esto, 401',
  })
  @ApiOperation({
    summary:
      'Crear el usuario administrador general de la plataforma (uso operativo manual, no expuesto en la app)',
  })
  crear(@Body() dto: CrearSuperadminDto) {
    return this.superadminService.crear(dto);
  }

  @Get('negocios')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPERADMIN')
  @ApiOperation({
    summary: 'Listar todos los negocios de la plataforma, con actividad resumida de cada uno',
  })
  listarNegocios() {
    return this.superadminService.listarNegocios();
  }

  @Post('negocios')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPERADMIN')
  @ApiOperation({
    summary: 'Crear un negocio nuevo (guarda el email del futuro admin, pero no lo invita todavía)',
  })
  crearNegocio(@Body() dto: CrearNegocioSuperadminDto) {
    return this.superadminService.crearNegocio(dto);
  }

  @Post('negocios/:id/invitar-admin')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPERADMIN')
  @ApiOperation({
    summary: 'Invitar a un administrador para un negocio existente',
  })
  @ApiResponse({ status: 404, description: 'Negocio no encontrado' })
  invitarAdmin(@Param('id', ParseIntPipe) id: number, @Body() dto: InvitarAdminDto) {
    return this.superadminService.invitarAdmin(id, dto);
  }

  @Patch('negocios/:id/estado')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPERADMIN')
  @ApiOperation({ summary: 'Activar o desactivar un negocio (baja/reactivación desde el panel superadmin)' })
  @ApiResponse({ status: 404, description: 'Negocio no encontrado' })
  cambiarEstado(@Param('id', ParseIntPipe) id: number, @Body() dto: CambiarEstadoNegocioDto) {
    return this.superadminService.cambiarEstadoNegocio(id, dto.activo);
  }
}
