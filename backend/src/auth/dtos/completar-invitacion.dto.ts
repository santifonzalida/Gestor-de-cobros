import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CompletarInvitacionDto {
  @ApiProperty({ description: 'Token de invitación recibido por email' })
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty({ description: 'Contraseña que va a usar el alumno para loguearse', minLength: 6 })
  @MinLength(6)
  password: string;
}
