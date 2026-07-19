import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pago } from './modelo/pago.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pago])],
})
export class PagosModule {}
