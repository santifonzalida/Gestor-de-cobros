import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const NOMBRE_REMITENTE = 'Gestor de Cobros';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly apiKey?: string;
  private readonly remitente: string;

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get<string>('BREVO_API_KEY');
    this.remitente =
      this.config.get<string>('SMTP_FROM') ?? 'no-reply@gestordecobros.local';

    if (this.apiKey) {
      this.logger.log(
        'API de Brevo configurada para el envío de invitaciones.',
      );
    } else {
      this.logger.warn(
        'BREVO_API_KEY no configurada — las invitaciones se van a loguear por consola en vez de enviarse.',
      );
    }
  }

  async enviarInvitacionAlumno(
    destinatario: string,
    nombreAlumno: string,
    link: string,
    logoUrl?: string,
  ): Promise<void> {
    const html = `
      ${this.logoHtml(logoUrl)}
      <p>Hola ${nombreAlumno},</p>
      <p>Te invitaron a crear tu acceso al portal de cuotas. Hacé click en el siguiente link para definir tu contraseña:</p>
      <p><a href="${link}">${link}</a></p>
      <p>Este link vence en 48 horas.</p>
    `;
    await this.enviarCorreo(destinatario, 'Te invitaron a acceder a tu portal de cuotas', html);
  }

  async enviarInvitacionAdmin(
    destinatario: string,
    nombreNegocio: string,
    link: string,
    logoUrl?: string,
  ): Promise<void> {
    const html = `
      ${this.logoHtml(logoUrl)}
      <p>Hola,</p>
      <p>Te invitaron a administrar <strong>${nombreNegocio}</strong> en Gestor de Cobros. Hacé click en el siguiente link para definir tu contraseña:</p>
      <p><a href="${link}">${link}</a></p>
      <p>Este link vence en 48 horas.</p>
    `;
    await this.enviarCorreo(destinatario, `Te invitaron a administrar ${nombreNegocio}`, html);
  }

  private logoHtml(logoUrl?: string): string {
    return logoUrl ? `<img src="${logoUrl}" alt="" style="max-height:64px;margin-bottom:12px" />` : '';
  }

  private async enviarCorreo(destinatario: string, asunto: string, html: string): Promise<void> {
    if (!this.apiKey) {
      this.logger.warn(
        `Brevo no configurado — mostrando la invitación por consola en vez de enviarla.\nDestinatario: ${destinatario}\nAsunto: ${asunto}`,
      );
      this.logger.warn(html);
      return;
    }

    this.logger.log(
      `Enviando invitación a "${destinatario}" vía API de Brevo...`,
    );

    let respuesta: Response;
    try {
      respuesta = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          sender: { email: this.remitente, name: NOMBRE_REMITENTE },
          to: [{ email: destinatario }],
          subject: asunto,
          htmlContent: html,
        }),
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Falló la conexión con la API de Brevo para "${destinatario}": ${err.message}`,
        err.stack,
      );
      throw new Error('No se pudo conectar con el servicio de email.');
    }

    if (!respuesta.ok) {
      const cuerpo = await respuesta.text();
      this.logger.error(
        `Brevo rechazó el envío a "${destinatario}" — status=${respuesta.status} body=${cuerpo}`,
      );
      throw new Error(
        `No se pudo enviar el email de invitación (Brevo respondió ${respuesta.status}).`,
      );
    }

    const data = (await respuesta.json()) as { messageId?: string };
    this.logger.log(
      `Invitación enviada a "${destinatario}" — messageId=${data.messageId ?? '?'}`,
    );
  }
}
