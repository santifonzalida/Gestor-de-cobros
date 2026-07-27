import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NegocioId } from '../../auth/decorators/negocio-id.decorator';
import { AlumnoIdSesion } from '../../auth/decorators/alumno-id-sesion.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { ActualizarPagoDto } from '../dtos/actualizar-pago.dto';
import { CrearPagoDto } from '../dtos/crear-pago.dto';
import { FiltrarPagosDto } from '../dtos/filtrar-pagos.dto';
import { PagosService } from '../servicios/pagos.service';

@ApiTags('Pagos')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Registrar un pago (marca la cuota asociada como PAGADA)' })
  @ApiResponse({ status: 201, description: 'Pago registrado exitosamente' })
  @ApiResponse({ status: 400, description: 'La cuota ya tiene un pago registrado' })
  crear(
    @Body() dto: CrearPagoDto,
    @NegocioId() negocioId: number,
    @Req() request: { user: { sub: number } },
  ) {
    return this.pagosService.crear(dto, negocioId, request.user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Listar pagos (filtrable por cuota y método)' })
  listarTodos(
    @Query() filtros: FiltrarPagosDto,
    @NegocioId() negocioId: number,
    @AlumnoIdSesion() alumnoIdSesion: number | null,
  ) {
    return this.pagosService.listarTodos(filtros, negocioId, alumnoIdSesion);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un pago por id' })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  obtenerPorId(
    @Param('id', ParseIntPipe) id: number,
    @NegocioId() negocioId: number,
    @AlumnoIdSesion() alumnoIdSesion: number | null,
  ) {
    return this.pagosService.obtenerPorId(id, negocioId, alumnoIdSesion);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Actualizar un pago' })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarPagoDto,
    @NegocioId() negocioId: number,
  ) {
    return this.pagosService.actualizar(id, dto, negocioId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Eliminar un pago (revierte la cuota asociada a PENDIENTE)' })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  eliminar(@Param('id', ParseIntPipe) id: number, @NegocioId() negocioId: number) {
    return this.pagosService.eliminar(id, negocioId);
  }
}
