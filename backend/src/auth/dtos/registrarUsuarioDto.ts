import {
  IsEmail,
  MinLength,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegistrarUsuarioDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'password123',
    minLength: 6,
  })
  @MinLength(6)
  password: string;

  @ApiProperty({ description: 'Nombre del usuario', example: 'Juan' })
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ description: 'Apellido del usuario', example: 'Pérez' })
  @IsNotEmpty()
  apellido: string;

  @ApiPropertyOptional({
    description: 'Nombre del rol a asignar',
    example: 'PROFESIONAL',
    enum: ['USER', 'PROFESIONAL', 'TUTOR', 'SECRETARIA', 'DIRECTOR'],
  })
  @IsOptional()
  @IsString()
  roleName?: string;
}
