import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ActualizarNegocioDto {
  @ApiProperty({
    description: 'Nombre del negocio',
    example: 'Academia Deportiva XYZ',
  })
  @IsString()
  @IsNotEmpty()
  nombre: string;
}
