import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { EstadoComprobante } from '../modelo/estado-comprobante.enum';

export class FiltrarComprobantesDto {
  @ApiPropertyOptional({ description: 'Filtrar por alumno' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  alumnoId?: number;

  @ApiPropertyOptional({ description: 'Filtrar por clase (todos los comprobantes de los alumnos de esa clase)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  claseId?: number;

  @ApiPropertyOptional({ enum: EstadoComprobante, description: 'Filtrar por estado' })
  @IsOptional()
  @IsEnum(EstadoComprobante)
  estado?: EstadoComprobante;

  @ApiPropertyOptional({ description: 'Filtrar por mes de la cuota (1-12)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  mes?: number;

  @ApiPropertyOptional({ description: 'Filtrar por año de la cuota' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  anio?: number;
}
