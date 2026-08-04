import { ApiProperty } from '@nestjs/swagger';
import { IsHexColor } from 'class-validator';

export class ActualizarColorDto {
  @ApiProperty({ description: 'Color de acento en formato hexadecimal', example: '#FB923C' })
  @IsHexColor()
  colorAccento: string;
}
