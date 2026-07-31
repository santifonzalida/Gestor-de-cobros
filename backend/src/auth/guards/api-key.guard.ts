import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Protege endpoints operativos (sin login de por medio, ej. alta de Negocio)
 * con una clave compartida por header en vez de un JWT — pensado para uso
 * manual (curl/Postman) por quien administra la plataforma, no para la app.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const claveEsperada = this.config.get<string>('ADMIN_SETUP_KEY');
    if (!claveEsperada) {
      throw new InternalServerErrorException(
        'ADMIN_SETUP_KEY no está configurada.',
      );
    }

    const request = context.switchToHttp().getRequest();
    const claveRecibida = request.headers['x-api-key'];

    if (claveRecibida !== claveEsperada) {
      throw new UnauthorizedException('Clave inválida.');
    }
    return true;
  }
}
