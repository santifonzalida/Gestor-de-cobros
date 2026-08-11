import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alumno } from '../alumnos/modelo/alumno.entity';
import { Cuota } from '../cuotas/modelo/cuota.entity';
import { Negocio } from '../negocios/modelo/negocio.entity';
import { Pago } from '../pagos/modelo/pago.entity';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { SuperadminController } from './controladores/superadmin.controller';
import { SuperadminService } from './servicios/superadmin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Negocio, Alumno, Cuota, Pago]),
    UsuariosModule,
  ],
  controllers: [SuperadminController],
  providers: [SuperadminService],
})
export class SuperadminModule {}
