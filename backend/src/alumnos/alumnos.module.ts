import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClasesModule } from '../clases/clases.module';
import { CuotasModule } from '../cuotas/cuotas.module';
import { Alumno } from './modelo/alumno.entity';
import { AlumnosService } from './servicios/alumnos.service';
import { AlumnosController } from './controladores/alumnos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Alumno]), ClasesModule, forwardRef(() => CuotasModule)],
  controllers: [AlumnosController],
  providers: [AlumnosService],
  exports: [AlumnosService],
})
export class AlumnosModule {}
