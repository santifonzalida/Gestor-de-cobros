import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alumno } from '../alumnos/modelo/alumno.entity';
import { AuthModule } from '../auth/auth.module';
import { Negocio } from '../negocios/modelo/negocio.entity';
import { NegociosModule } from '../negocios/negocios.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { SuperadminController } from './controladores/superadmin.controller';
import { SuperadminService } from './servicios/superadmin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Negocio, Alumno]),
    UsuariosModule,
    NegociosModule,
    AuthModule,
  ],
  controllers: [SuperadminController],
  providers: [SuperadminService],
})
export class SuperadminModule {}
