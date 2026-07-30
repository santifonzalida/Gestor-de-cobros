import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArchivosModule } from '../archivos/archivos.module';
import { Negocio } from './modelo/negocio.entity';
import { NegociosService } from './servicios/negocios.service';
import { NegociosController } from './controladores/negocios.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Negocio]), ArchivosModule],
  controllers: [NegociosController],
  providers: [NegociosService],
  exports: [NegociosService, TypeOrmModule],
})
export class NegociosModule {}
