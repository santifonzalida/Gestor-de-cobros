import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Clase } from './modelo/clase.entity';
import { ClasesService } from './servicios/clases.service';
import { ClasesController } from './controladores/clases.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Clase])],
  controllers: [ClasesController],
  providers: [ClasesService],
  exports: [ClasesService],
})
export class ClasesModule {}