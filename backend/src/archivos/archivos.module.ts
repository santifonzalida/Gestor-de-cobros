import { Module } from '@nestjs/common';
import { ArchivosService } from './servicios/archivos.service';

@Module({
  providers: [ArchivosService],
  exports: [ArchivosService],
})
export class ArchivosModule {}
