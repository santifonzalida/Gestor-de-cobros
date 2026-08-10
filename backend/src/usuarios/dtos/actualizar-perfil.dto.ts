import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ActualizarPerfilDto {
  @ApiProperty({ description: 'Nombre', example: 'Juan' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ description: 'Apellido', example: 'Pérez' })
  @IsString()
  @IsNotEmpty()
  apellido: string;
}
