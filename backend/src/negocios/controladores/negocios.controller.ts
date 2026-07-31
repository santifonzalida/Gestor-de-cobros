import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { NegocioId } from '../../auth/decorators/negocio-id.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { ConfirmarLogoDto } from '../dtos/confirmar-logo.dto';
import { SolicitarSubidaLogoDto } from '../dtos/solicitar-subida-logo.dto';
import { NegociosService } from '../servicios/negocios.service';

@ApiTags('Negocios')
@Controller('negocios')
export class NegociosController {
  constructor(private readonly negociosService: NegociosService) {}

  @Get('actual')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: 'Datos públicos del negocio de la sesión actual (nombre, logo)',
  })
  obtenerActual(@NegocioId() negocioId: number) {
    return this.negociosService.obtenerActualConLogo(negocioId);
  }

  @Post('actual/logo/solicitar-subida')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Pedir una URL prefirmada para subir el logo del negocio',
  })
  solicitarSubidaLogo(
    @Body() dto: SolicitarSubidaLogoDto,
    @NegocioId() negocioId: number,
  ) {
    return this.negociosService.solicitarSubidaLogo(negocioId, dto);
  }

  @Post('actual/logo/confirmar')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Confirmar que el logo ya se subió al bucket' })
  confirmarLogo(@Body() dto: ConfirmarLogoDto, @NegocioId() negocioId: number) {
    return this.negociosService.confirmarLogo(negocioId, dto);
  }

  @Delete('actual/logo')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Quitar el logo cargado del negocio' })
  eliminarLogo(@NegocioId() negocioId: number) {
    return this.negociosService.eliminarLogo(negocioId);
  }

  @Get(':id/logo')
  @ApiOperation({
    summary:
      'Imagen del logo de un negocio (pública, sin auth — la usan el mail y el Portal)',
  })
  @ApiResponse({
    status: 404,
    description: 'El negocio no existe o no tiene logo cargado',
  })
  async descargarLogo(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const { body, contentType, contentLength } =
      await this.negociosService.descargarLogo(id);
    res.set({
      'Content-Type': contentType ?? 'application/octet-stream',
      // La URL es siempre la misma para un negocio (a propósito, para que el
      // link del mail no venza), pero el archivo detrás puede cambiar cuando
      // el admin sube uno nuevo o lo borra — "no-cache" obliga a revalidar
      // en cada request en vez de confiar ciegamente en una copia vieja.
      'Cache-Control': 'no-cache',
      ...(contentLength ? { 'Content-Length': String(contentLength) } : {}),
    });
    body.pipe(res);
  }
}
