import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rol } from './modelo/rol.entity';
import { Usuario } from './modelo/usuario.entity';
import { Permiso } from './modelo/permiso.entity';
import { UsuarioService } from './servicios/usuarios.service';

const entidades = TypeOrmModule.forFeature([Usuario, Rol, Permiso]);

@Module({
  imports: [entidades],
  providers: [UsuarioService],
  exports: [UsuarioService, entidades],
})
export class UsuariosModule {}
