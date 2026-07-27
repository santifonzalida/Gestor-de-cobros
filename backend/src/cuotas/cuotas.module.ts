import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlumnosModule } from '../alumnos/alumnos.module';
import { ClasesModule } from '../clases/clases.module';
import { Cuota } from './modelo/cuota.entity';
import { CuotasService } from './servicios/cuotas.service';
import { CuotasController } from './controladores/cuotas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Cuota]), forwardRef(() => AlumnosModule), ClasesModule],
  controllers: [CuotasController],
  providers: [CuotasService],
  exports: [CuotasService],
})
export class CuotasModule {}
