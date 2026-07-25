import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsPositive, Max, Min } from 'class-validator';

export class CrearCuotaPorClaseDto {
  @ApiProperty({ description: 'Id de la clase cuyos alumnos van a recibir la cuota', example: 1 })
  @IsInt()
  @IsPositive()
  claseId: number;

  @ApiProperty({ description: 'Mes de la cuota (1-12)', example: 7 })
  @IsInt()
  @Min(1)
  @Max(12)
  mes: number;

  @ApiProperty({ description: 'Año de la cuota', example: 2026 })
  @IsInt()
  @Min(2000)
  anio: number;

  @ApiProperty({ description: 'Monto de la cuota, igual para todos los alumnos de la clase', example: 28000 })
  @IsInt()
  @IsPositive()
  monto: number;

  @ApiProperty({ description: 'Fecha límite de pago', example: '2026-08-05' })
  @IsDateString()
  fechaVencimiento: string;
}
