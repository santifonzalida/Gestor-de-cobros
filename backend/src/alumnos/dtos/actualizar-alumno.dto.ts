import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CrearAlumnoDto } from './crear-alumno.dto';

export class ActualizarAlumnoDto extends PartialType(CrearAlumnoDto) {
  @ApiPropertyOptional({ description: 'Si el alumno sigue activo en la academia' })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
