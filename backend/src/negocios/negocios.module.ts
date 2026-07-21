import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Negocio } from './modelo/negocio.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Negocio])],
  exports: [TypeOrmModule],
})
export class NegociosModule {}
