import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CrearClaseDto {
  @ApiProperty({
    description: 'Nombre de la clase',
    example: 'Fútbol infantil',
  })
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiProperty({
    description: 'Icono representativo de la clase',
    example: 'soccer-ball',
  })
  @IsString()
  icono: string;

  @ApiProperty({
    description: 'Descripción de la clase',
    example: 'Clase de fútbol para niños de 6 a 12 años',
    required: false,
  })
  @IsString()
  descripcion?: string;
}
