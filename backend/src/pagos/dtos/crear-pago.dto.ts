import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { MetodoPago } from '../modelo/metodo-pago.enum';

export class CrearPagoDto {
  @ApiProperty({ description: 'Id de la cuota que se está pagando', example: 1 })
  @IsInt()
  @IsPositive()
  cuotaId: number;

  @ApiProperty({ enum: MetodoPago, description: 'Método de pago utilizado' })
  @IsEnum(MetodoPago)
  metodo: MetodoPago;

  @ApiProperty({ description: 'Monto efectivamente pagado', example: 28000 })
  @IsInt()
  @IsPositive()
  montoPagado: number;

  @ApiProperty({ description: 'Fecha en la que se realizó el pago', example: '2026-07-20' })
  @IsDateString()
  fechaPago: string;

  @ApiPropertyOptional({ description: 'URL del comprobante (por ahora un link, sin upload de archivo)' })
  @IsOptional()
  @IsString()
  comprobanteUrl?: string;
}
