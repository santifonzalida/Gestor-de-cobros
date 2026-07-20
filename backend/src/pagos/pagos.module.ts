import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CuotasModule } from '../cuotas/cuotas.module';
import { Pago } from './modelo/pago.entity';
import { PagosService } from './servicios/pagos.service';
import { PagosController } from './controladores/pagos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Pago]), CuotasModule],
  controllers: [PagosController],
  providers: [PagosService],
  exports: [PagosService],
})
export class PagosModule {}
