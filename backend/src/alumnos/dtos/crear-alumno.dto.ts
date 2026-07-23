import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString } from 'class-validator';

export class CrearAlumnoDto {
  @ApiProperty({ description: 'Nombre del alumno', example: 'Lucas' })
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @ApiProperty({ description: 'Apellido del alumno', example: 'Fernández' })
  @IsNotEmpty()
  @IsString()
  apellido: string;

  @ApiPropertyOptional({ description: 'Teléfono de contacto', example: '+54 9 11 1234-5678' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({ description: 'Email del alumno', example: 'lucas.fernandez@mail.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Id de la clase a la que pertenece el alumno', example: 1 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  claseId?: number;
}
