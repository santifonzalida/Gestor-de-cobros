import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CrearNegocioDto {
  @ApiProperty({
    description: 'Nombre del negocio',
    example: 'Academia Deportiva XYZ',
  })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiPropertyOptional({ description: 'Descripción del negocio' })
  @IsOptional()
  @IsString()
  descripcion?: string;
}
