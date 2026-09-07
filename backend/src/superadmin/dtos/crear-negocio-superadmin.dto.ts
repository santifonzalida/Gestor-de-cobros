import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CrearNegocioSuperadminDto {
  @ApiProperty({
    description: 'Nombre del negocio',
    example: 'Academia Deportiva XYZ',
  })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({
    description:
      'Email del futuro administrador — se guarda para cuando se dispare la invitación, no se envía nada en este paso',
    example: 'admin@negocio.com',
  })
  @IsEmail()
  emailAdmin: string;
}
