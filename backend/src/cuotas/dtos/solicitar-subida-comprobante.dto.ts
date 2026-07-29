import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

const CONTENT_TYPES_PERMITIDOS = ['image/jpeg', 'image/png', 'application/pdf'];

export class SolicitarSubidaComprobanteDto {
  @ApiProperty({ description: 'Nombre original del archivo', example: 'comprobante.jpg' })
  @IsString()
  @IsNotEmpty()
  nombreArchivo: string;

  @ApiProperty({ description: 'Tipo de contenido del archivo', enum: CONTENT_TYPES_PERMITIDOS })
  @IsIn(CONTENT_TYPES_PERMITIDOS)
  contentType: string;
}
