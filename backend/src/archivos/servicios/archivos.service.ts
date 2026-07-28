import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  HeadObjectCommand,
  NotFound,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const TTL_SUBIDA_SEGUNDOS = 5 * 60;
const TTL_DESCARGA_SEGUNDOS = 10 * 60;

@Injectable()
export class ArchivosService {
  private readonly cliente: S3Client | null;
  private readonly bucket: string | undefined;

  constructor(private config: ConfigService) {
    const endpoint = this.config.get<string>('RAILWAY_BUCKET_ENDPOINT');
    this.bucket = this.config.get<string>('RAILWAY_BUCKET_NAME');

    this.cliente = endpoint
      ? new S3Client({
          region: 'auto',
          endpoint,
          forcePathStyle: true,
          credentials: {
            accessKeyId: this.config.get<string>('RAILWAY_BUCKET_ACCESS_KEY_ID') ?? '',
            secretAccessKey: this.config.get<string>('RAILWAY_BUCKET_SECRET_ACCESS_KEY') ?? '',
          },
        })
      : null;
  }

  private obtenerClienteOFallar(): S3Client {
    if (!this.cliente || !this.bucket) {
      throw new InternalServerErrorException(
        'El almacenamiento de archivos no está configurado (RAILWAY_BUCKET_*).',
      );
    }
    return this.cliente;
  }

  async generarUrlSubida(key: string, contentType: string): Promise<string> {
    const cliente = this.obtenerClienteOFallar();
    const comando = new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType });
    return getSignedUrl(cliente, comando, { expiresIn: TTL_SUBIDA_SEGUNDOS });
  }

  async generarUrlDescarga(key: string): Promise<string> {
    const cliente = this.obtenerClienteOFallar();
    const comando = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(cliente, comando, { expiresIn: TTL_DESCARGA_SEGUNDOS });
  }

  async existe(key: string): Promise<boolean> {
    const cliente = this.obtenerClienteOFallar();
    try {
      await cliente.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return true;
    } catch (error) {
      if (error instanceof NotFound) return false;
      throw error;
    }
  }
}
