import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

const corsLogger = new Logger('CORS');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const origenesPermitidos = process.env.CORS_ORIGINS?.split(',') ?? [];
  corsLogger.log(
    `Orígenes permitidos: ${origenesPermitidos.join(', ') || '(ninguno configurado)'}`,
  );

  app.enableCors({
    origin: (origin, callback) => {
      // Sin header Origin (curl, health checks, server-to-server) → se deja pasar.
      if (!origin || origenesPermitidos.includes(origin)) {
        callback(null, true);
        return;
      }
      corsLogger.warn(
        `Origen rechazado: "${origin}" no está en CORS_ORIGINS (permitidos: ${origenesPermitidos.join(', ') || '(ninguno)'})`,
      );
      callback(new Error(`Origen no permitido por CORS: ${origin}`), false);
    },
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Gestor de Cobros API')
      .setDescription(
        'API para la gestión de alumnos, cuotas y pagos de la academia',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  await app.listen(3000);
}
bootstrap();
