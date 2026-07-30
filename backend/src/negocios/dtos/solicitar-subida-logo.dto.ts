import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

const CONTENT_TYPES_PERMITIDOS = [
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'image/webp',
];

export class SolicitarSubidaLogoDto {
  @ApiProperty({
    description: 'Nombre original del archivo',
    example: 'logo.png',
  })
  @IsString()
  @IsNotEmpty()
  nombreArchivo: string;

  @ApiProperty({
    description: 'Tipo de contenido del archivo',
    enum: CONTENT_TYPES_PERMITIDOS,
  })
  @IsIn(CONTENT_TYPES_PERMITIDOS)
  contentType: string;
}
