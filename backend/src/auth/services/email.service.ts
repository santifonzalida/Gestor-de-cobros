import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly remitente: string;
  private readonly host?: string;
  private readonly port: number;

  constructor(private config: ConfigService) {
    this.host = this.config.get<string>('SMTP_HOST');
    this.remitente =
      this.config.get<string>('SMTP_FROM') ?? 'no-reply@gestordecobros.local';

    this.port = Number(this.config.get<string>('SMTP_PORT') ?? 587);

    this.transporter = this.host
      ? nodemailer.createTransport({
          host: this.host,
          port: this.port,
          secure: false, // 465 = TLS implícito; 587/25 usan STARTTLS (secure debe ir en false)
          auth: {
            user: this.config.get<string>('SMTP_USER'),
            pass: this.config.get<string>('SMTP_PASSWORD'),
          },
          logger: true, // loguea el diálogo SMTP completo (EHLO/STARTTLS/AUTH) por consola
        })
      : null;

    if (this.host) {
      this.logger.log(
        `Transporter SMTP configurado: host=${this.host} port=${this.port} user=${this.config.get<string>('SMTP_USER') ?? '(sin usuario)'}`,
      );
    } else {
      this.logger.warn(
        'SMTP_HOST no configurado — las invitaciones se van a loguear por consola en vez de enviarse.',
      );
    }
  }

  async enviarInvitacionAlumno(
    destinatario: string,
    nombreAlumno: string,
    link: string,
  ): Promise<void> {
    const asunto = 'Te invitaron a acceder a tu portal de cuotas';
    const html = `
      <p>Hola ${nombreAlumno},</p>
      <p>Te invitaron a crear tu acceso al portal de cuotas. Hacé click en el siguiente link para definir tu contraseña:</p>
      <p><a href="${link}">${link}</a></p>
      <p>Este link vence en 48 horas.</p>
    `;

    if (!this.transporter) {
      this.logger.warn(
        `SMTP no configurado — mostrando la invitación por consola en vez de enviarla.\nDestinatario: ${destinatario}\nLink: ${link}`,
      );
      return;
    }

    this.logger.log(
      `Intentando enviar invitación a "${destinatario}" vía ${this.host}:${this.port}...`,
    );

    try {
      const info = await this.transporter.sendMail({
        from: this.remitente,
        to: destinatario,
        subject: asunto,
        html,
      });
      this.logger.log(
        `Invitación enviada a "${destinatario}" — messageId=${info.messageId} response="${info.response}"`,
      );
    } catch (error) {
      const err = error as Error & {
        code?: string;
        command?: string;
        response?: string;
        responseCode?: number;
      };
      this.logger.error(
        `Falló el envío a "${destinatario}" vía ${this.host}:${this.port} — ` +
          `code=${err.code ?? '?'} command=${err.command ?? '?'} responseCode=${err.responseCode ?? '?'} response="${err.response ?? '?'}"`,
        err.stack,
      );
      throw error;
    }
  }
}
