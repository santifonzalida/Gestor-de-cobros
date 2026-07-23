import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CrearClaseDto {
  @ApiProperty({ description: 'Nombre de la clase', example: 'Fútbol infantil' })
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiProperty({ description: 'Icono representativo de la clase', example: 'soccer-ball' })
  @IsNotEmpty()
  @IsString()
  icono: string;
}