import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly remitente: string;

  constructor(private config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    this.remitente =
      this.config.get<string>('SMTP_FROM') ?? 'no-reply@gestordecobros.local';

    const port = Number(this.config.get<string>('SMTP_PORT') ?? 587);

    this.transporter = host
      ? nodemailer.createTransport({
          host,
          port,
          secure: port === 465, // 465 = TLS implícito; 587/25 usan STARTTLS (secure debe ir en false)
          auth: {
            user: this.config.get<string>('SMTP_USER'),
            pass: this.config.get<string>('SMTP_PASSWORD'),
          },
        })
      : null;
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

    await this.transporter.sendMail({
      from: this.remitente,
      to: destinatario,
      subject: asunto,
      html,
    });
  }
}
