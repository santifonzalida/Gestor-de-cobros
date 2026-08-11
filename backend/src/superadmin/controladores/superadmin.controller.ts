import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ApiKeyGuard } from '../../auth/guards/api-key.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CrearSuperadminDto } from '../dtos/crear-superadmin.dto';
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
}
