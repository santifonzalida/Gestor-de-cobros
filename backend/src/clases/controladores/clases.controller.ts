import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NegocioId } from '../../auth/decorators/negocio-id.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { ActualizarClaseDto } from '../dtos/actualizar-clase.dto';
import { CrearClaseDto } from '../dtos/crear-clase.dto';
import { ClasesService } from '../servicios/clases.service';

@ApiTags('Clases')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('clases')
export class ClasesController {
  constructor(private readonly clasesService: ClasesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Crear una nueva clase' })
  @ApiResponse({ status: 201, description: 'Clase creada exitosamente' })
  crear(@Body() dto: CrearClaseDto, @NegocioId() negocioId: number) {
    return this.clasesService.crear(dto, negocioId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las clases' })
  listarTodos(@NegocioId() negocioId: number) {
    return this.clasesService.listarTodos(negocioId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una clase por id' })
  @ApiResponse({ status: 404, description: 'Clase no encontrada' })
  obtenerPorId(@Param('id', ParseIntPipe) id: number, @NegocioId() negocioId: number) {
    return this.clasesService.obtenerPorId(id, negocioId);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Actualizar una clase' })
  @ApiResponse({ status: 404, description: 'Clase no encontrada' })
  actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarClaseDto,
    @NegocioId() negocioId: number,
  ) {
    return this.clasesService.actualizar(id, dto, negocioId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Eliminar una clase' })
  @ApiResponse({ status: 404, description: 'Clase no encontrada' })
  eliminar(@Param('id', ParseIntPipe) id: number, @NegocioId() negocioId: number) {
    return this.clasesService.eliminar(id, negocioId);
  }
}