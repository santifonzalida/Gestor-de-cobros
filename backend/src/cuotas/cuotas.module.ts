import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlumnosModule } from '../alumnos/alumnos.module';
import { ClasesModule } from '../clases/clases.module';
import { PagosModule } from '../pagos/pagos.module';
import { ArchivosModule } from '../archivos/archivos.module';
import { ComprobantesModule } from '../comprobantes/comprobantes.module';
import { Cuota } from './modelo/cuota.entity';
import { CuotasService } from './servicios/cuotas.service';
import { CuotasController } from './controladores/cuotas.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cuota]),
    forwardRef(() => AlumnosModule),
    ClasesModule,
    forwardRef(() => PagosModule),
    ArchivosModule,
    ComprobantesModule,
  ],
  controllers: [CuotasController],
  providers: [CuotasService],
  exports: [CuotasService],
})
export class CuotasModule {}
