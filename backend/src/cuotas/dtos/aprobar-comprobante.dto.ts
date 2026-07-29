import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsPositive } from 'class-validator';
import { MetodoPago } from '../../pagos/modelo/metodo-pago.enum';

export class AprobarComprobanteDto {
  @ApiProperty({ enum: MetodoPago, description: 'Método de pago utilizado' })
  @IsEnum(MetodoPago)
  metodo: MetodoPago;

  @ApiPropertyOptional({ description: 'Monto efectivamente pagado (por defecto, el monto de la cuota)' })
  @IsOptional()
  @IsInt()
  @IsPositive()
  montoPagado?: number;
}
