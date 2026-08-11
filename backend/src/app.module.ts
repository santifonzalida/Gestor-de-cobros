import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AlumnosModule } from './alumnos/alumnos.module';
import { CuotasModule } from './cuotas/cuotas.module';
import { PagosModule } from './pagos/pagos.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { NegociosModule } from './negocios/negocios.module';
import { ClasesModule } from './clases/clases.module';
import { SuperadminModule } from './superadmin/superadmin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true, //quitar en produccion
    }),
    AuthModule,
    AlumnosModule,
    CuotasModule,
    PagosModule,
    UsuariosModule,
    NegociosModule,
    ClasesModule,
    SuperadminModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
