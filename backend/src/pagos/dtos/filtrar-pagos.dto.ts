import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { MetodoPago } from '../modelo/metodo-pago.enum';

export class FiltrarPagosDto {
  @ApiPropertyOptional({ description: 'Filtrar por cuota' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  cuotaId?: number;

  @ApiPropertyOptional({ enum: MetodoPago, description: 'Filtrar por método de pago' })
  @IsOptional()
  @IsEnum(MetodoPago)
  metodo?: MetodoPago;
}
