import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlumnosModule } from '../alumnos/alumnos.module';
import { Cuota } from './modelo/cuota.entity';
import { CuotasService } from './servicios/cuotas.service';
import { CuotasController } from './controladores/cuotas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Cuota]), AlumnosModule],
  controllers: [CuotasController],
  providers: [CuotasService],
  exports: [CuotasService],
})
export class CuotasModule {}
