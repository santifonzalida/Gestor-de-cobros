import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsStrongPassword, IsString } from 'class-validator';

export class CrearSuperadminDto {
  @ApiProperty({
    description: 'Email del administrador general',
    example: 'dueño@gestordecobros.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description:
      'Contraseña — mínimo 8 caracteres, con al menos una mayúscula, una minúscula, un número y un símbolo. Más exigente que la de un ADMIN de negocio a propósito: esta cuenta ve datos de todos los negocios.',
    example: 'UnaPassword#Segura123',
    minLength: 8,
  })
  @IsStrongPassword(
    { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 },
    {
      message:
        'La contraseña tiene que tener al menos 8 caracteres, con mayúscula, minúscula, número y símbolo.',
    },
  )
  password: string;

  @ApiProperty({ description: 'Nombre', example: 'Ana' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ description: 'Apellido', example: 'Fernández' })
  @IsString()
  @IsNotEmpty()
  apellido: string;
}
