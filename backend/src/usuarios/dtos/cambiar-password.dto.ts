import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CambiarPasswordDto {
  @ApiProperty({ description: 'Contraseña actual' })
  @IsString()
  @IsNotEmpty()
  passwordActual: string;

  @ApiProperty({ description: 'Contraseña nueva', minLength: 6 })
  @IsString()
  @MinLength(6)
  passwordNueva: string;
}
