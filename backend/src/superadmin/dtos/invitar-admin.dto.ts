import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class InvitarAdminDto {
  @ApiProperty({
    description: 'Email del administrador a invitar — recibe un mail para definir su contraseña',
    example: 'admin@negocio.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Nombre del administrador', example: 'Juan' })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({ description: 'Apellido del administrador', example: 'Pérez' })
  @IsOptional()
  @IsString()
  apellido?: string;
}
