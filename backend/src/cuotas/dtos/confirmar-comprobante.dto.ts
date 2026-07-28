import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmarComprobanteDto {
  @ApiProperty({ description: 'Key del objeto ya subido al bucket' })
  @IsString()
  @IsNotEmpty()
  key: string;
}
