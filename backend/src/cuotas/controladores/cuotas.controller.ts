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
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NegocioId } from '../../auth/decorators/negocio-id.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { ActualizarCuotaDto } from '../dtos/actualizar-cuota.dto';
import { CrearCuotaDto } from '../dtos/crear-cuota.dto';
import { CrearCuotaPorClaseDto } from '../dtos/crear-cuota-por-clase.dto';
import { FiltrarCuotasDto } from '../dtos/filtrar-cuotas.dto';
import { CuotasService } from '../servicios/cuotas.service';

@ApiTags('Cuotas')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('cuotas')
export class CuotasController {
  constructor(private readonly cuotasService: CuotasService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Crear una nueva cuota' })
  @ApiResponse({ status: 201, description: 'Cuota creada exitosamente' })
  crear(@Body() dto: CrearCuotaDto, @NegocioId() negocioId: number) {
    return this.cuotasService.crear(dto, negocioId);
  }

  @Post('por-clase')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Crear una cuota para cada alumno de una clase (mismo mes/monto/vencimiento)' })
  @ApiResponse({ status: 201, description: 'Cuotas creadas; incluye cuántas se omitieron por ya existir' })
  crearPorClase(@Body() dto: CrearCuotaPorClaseDto, @NegocioId() negocioId: number) {
    return this.cuotasService.crearPorClase(dto, negocioId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar cuotas (filtrable por alumno, estado, mes y año)' })
  listarTodos(@Query() filtros: FiltrarCuotasDto, @NegocioId() negocioId: number) {
    return this.cuotasService.listarTodos(filtros, negocioId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una cuota por id' })
  @ApiResponse({ status: 404, description: 'Cuota no encontrada' })
  obtenerPorId(@Param('id', ParseIntPipe) id: number, @NegocioId() negocioId: number) {
    return this.cuotasService.obtenerPorId(id, negocioId);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Actualizar una cuota' })
  @ApiResponse({ status: 404, description: 'Cuota no encontrada' })
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarCuotaDto,
    @NegocioId() negocioId: number,
  ) {
    return this.cuotasService.actualizar(id, dto, negocioId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Eliminar una cuota' })
  @ApiResponse({ status: 404, description: 'Cuota no encontrada' })
  eliminar(@Param('id', ParseIntPipe) id: number, @NegocioId() negocioId: number) {
    return this.cuotasService.eliminar(id, negocioId);
  }
}
