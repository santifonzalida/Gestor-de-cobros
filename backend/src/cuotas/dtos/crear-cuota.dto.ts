import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  Max,
  Min,
} from 'class-validator';
import { EstadoCuota } from '../modelo/estado-cuota.enum';

export class CrearCuotaDto {
  @ApiProperty({ description: 'Id del alumno al que pertenece la cuota', example: 1 })
  @IsInt()
  @IsPositive()
  alumnoId: number;

  @ApiProperty({ description: 'Mes de la cuota (1-12)', example: 7 })
  @IsInt()
  @Min(1)
  @Max(12)
  mes: number;

  @ApiProperty({ description: 'Año de la cuota', example: 2026 })
  @IsInt()
  @Min(2000)
  anio: number;

  @ApiProperty({ description: 'Monto de la cuota', example: 28000 })
  @IsInt()
  @IsPositive()
  monto: number;

  @ApiProperty({ description: 'Fecha límite de pago', example: '2026-08-05' })
  @IsDateString()
  fechaVencimiento: string;

  @ApiPropertyOptional({ enum: EstadoCuota, description: 'Estado inicial (por defecto PENDIENTE)' })
  @IsOptional()
  @IsEnum(EstadoCuota)
  estado?: EstadoCuota;
}
