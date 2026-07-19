import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alumno } from './modelo/alumno.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Alumno])],
})
export class AlumnosModule {}
