import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CrearAdminDto {
  @ApiProperty({
    description: 'Email del administrador',
    example: 'admin@negocio.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Contraseña',
    example: 'UnaPasswordSegura123',
    minLength: 6,
  })
  @MinLength(6)
  password: string;

  @ApiProperty({ description: 'Nombre', example: 'Juan' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ description: 'Apellido', example: 'Pérez' })
  @IsString()
  @IsNotEmpty()
  apellido: string;
}
