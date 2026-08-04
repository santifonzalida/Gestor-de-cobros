import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArchivosModule } from '../archivos/archivos.module';
import { Cuota } from '../cuotas/modelo/cuota.entity';
import { Comprobante } from './modelo/comprobante.entity';
import { ComprobantesService } from './servicios/comprobantes.service';
import { ComprobantesController } from './controladores/comprobantes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Comprobante, Cuota]), ArchivosModule],
  controllers: [ComprobantesController],
  providers: [ComprobantesService],
  exports: [ComprobantesService],
})
export class ComprobantesModule {}
