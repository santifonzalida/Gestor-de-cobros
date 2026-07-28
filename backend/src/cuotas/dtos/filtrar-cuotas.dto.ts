import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { EstadoCuota } from '../modelo/estado-cuota.enum';

export class FiltrarCuotasDto {
  @ApiPropertyOptional({ description: 'Filtrar por alumno' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  alumnoId?: number;

  @ApiPropertyOptional({ description: 'Filtrar por clase (todas las cuotas de los alumnos de esa clase)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  claseId?: number;

  @ApiPropertyOptional({ enum: EstadoCuota, description: 'Filtrar por estado' })
  @IsOptional()
  @IsEnum(EstadoCuota)
  estado?: EstadoCuota;

  @ApiPropertyOptional({ description: 'Filtrar por mes (1-12)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  mes?: number;

  @ApiPropertyOptional({ description: 'Filtrar por año' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  anio?: number;
}
