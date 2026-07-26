import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class InvitarAlumnoDto {
  @ApiProperty({ description: 'Id del alumno a invitar', example: 1 })
  @IsInt()
  @IsPositive()
  alumnoId: number;
}
