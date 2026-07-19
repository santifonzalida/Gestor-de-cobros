import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cuota } from './modelo/cuota.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cuota])],
})
export class CuotasModule {}
