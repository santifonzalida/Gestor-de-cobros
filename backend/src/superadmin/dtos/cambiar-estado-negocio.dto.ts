import { IsBoolean } from 'class-validator';

export class CambiarEstadoNegocioDto {
  @IsBoolean()
  activo: boolean;
}
