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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AlumnosService } from '../servicios/alumnos.service';
import { CrearAlumnoDto } from '../dtos/crear-alumno.dto';
import { ActualizarAlumnoDto } from '../dtos/actualizar-alumno.dto';

@ApiTags('Alumnos')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('alumnos')
export class AlumnosController {
  constructor(private readonly alumnosService: AlumnosService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo alumno' })
  @ApiResponse({ status: 201, description: 'Alumno creado exitosamente' })
  crear(@Body() dto: CrearAlumnoDto) {
    return this.alumnosService.crear(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los alumnos' })
  listarTodos() {
    return this.alumnosService.listarTodos();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un alumno por id' })
  @ApiResponse({ status: 404, description: 'Alumno no encontrado' })
  obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.alumnosService.obtenerPorId(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar datos de un alumno' })
  @ApiResponse({ status: 404, description: 'Alumno no encontrado' })
  actualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: ActualizarAlumnoDto) {
    return this.alumnosService.actualizar(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un alumno' })
  @ApiResponse({ status: 404, description: 'Alumno no encontrado' })
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.alumnosService.eliminar(id);
  }
}
