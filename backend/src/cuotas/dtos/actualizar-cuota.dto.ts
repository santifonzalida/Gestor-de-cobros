import { PartialType } from '@nestjs/mapped-types';
import { CrearCuotaDto } from './crear-cuota.dto';

export class ActualizarCuotaDto extends PartialType(CrearCuotaDto) {}
