import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NegocioId } from '../../auth/decorators/negocio-id.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { FiltrarComprobantesDto } from '../dtos/filtrar-comprobantes.dto';
import { ComprobantesService } from '../servicios/comprobantes.service';

@ApiTags('Comprobantes')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
@Controller('comprobantes')
export class ComprobantesController {
  constructor(private readonly comprobantesService: ComprobantesService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar el historial completo de comprobantes cargados (incluye rechazados), filtrable por alumno/clase/estado/mes/año',
  })
  listarTodos(@Query() filtros: FiltrarComprobantesDto, @NegocioId() negocioId: number) {
    return this.comprobantesService.listarTodos(filtros, negocioId);
  }

  @Get(':id/descargar')
  @ApiOperation({ summary: 'Obtener una URL prefirmada para ver un comprobante del historial' })
  @ApiResponse({ status: 404, description: 'El comprobante no existe o es de otro negocio' })
  obtenerUrlDescarga(@Param('id', ParseIntPipe) id: number, @NegocioId() negocioId: number) {
    return this.comprobantesService.obtenerUrlDescarga(id, negocioId);
  }
}
