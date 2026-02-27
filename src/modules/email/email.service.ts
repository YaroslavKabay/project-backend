import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';

// Типізація для email результатів
interface EmailResult {
  messageId: string;
  response: string;
}

// Типізація для SendGrid response
interface SendGridHeaders {
  [key: string]: string;
}

interface SendGridClientResponse {
  statusCode: number;
  headers: SendGridHeaders;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    // 📧 НАЛАШТУВАННЯ SENDGRID ЧЕРЕЗ CONFIG SERVICE
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    const fromEmail = this.configService.get<string>('SENDGRID_FROM_EMAIL');

    if (!apiKey || !fromEmail) {
      throw new Error('SENDGRID_API_KEY and SENDGRID_FROM_EMAIL are required');
    }

    this.fromEmail = fromEmail;
    sgMail.setApiKey(apiKey);
  }

  /**
   * 📧 ВІДПРАВЛЯЄ EMAIL ДЛЯ ВІДНОВЛЕННЯ ПАРОЛЮ (SENDGRID)
   *
   * @param email - Email користувача
   * @param resetToken - Токен для reset
   * @param userName - Імʼя користувача
   * @returns Promise<EmailResult>
   */
  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    userName: string,
  ): Promise<EmailResult> {
    try {
      return await this.sendEmail(email, resetToken, userName);
    } catch (error) {
      // 🔧 FALLBACK для розробки
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn(`🔧 Fallback: Token ${resetToken} for ${email}`);

        return {
          messageId: `fallback-${Date.now()}`,
          response: 'Development fallback - check console for token',
        };
      }

      this.logger.error('Email service failed:', error);
      throw error;
    }
  }

  /**
   * 📧 ВІДПРАВКА EMAIL ЧЕРЕЗ SENDGRID
   */
  private async sendEmail(
    email: string,
    resetToken: string,
    userName: string,
  ): Promise<EmailResult> {
    const resetUrl = `${
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001'
    }/reset-password?token=${resetToken}`;

    const msg = {
      to: email,
      from: this.fromEmail,
      subject: '🔑 Відновлення паролю - Investment Platform',
      text: `Привіт ${userName}! Для відновлення паролю перейди за посиланням: ${resetUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>🔑 Відновлення паролю</h2>
          <p>Привіт <strong>${userName}</strong>!</p>
          <p>Ви запросили відновлення паролю для вашого акаунту.</p>
          <div style="margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              🔄 Відновити пароль
            </a>
          </div>
          <p><strong>⏰ Посилання дійсне 15 хвилин.</strong></p>
          <p>Якщо ви не запрошували відновлення - просто ігноруйте цей email.</p>
          <hr>
          <small>Investment Platform Team</small>
        </div>
      `,
    };

    const result = await sgMail.send(msg);

    // SendGrid повертає [ClientResponse, {}] - беремо перший елемент
    const response = Array.isArray(result) ? result[0] : result;
    const clientResponse = response as SendGridClientResponse;
    const messageId =
      clientResponse.headers['x-message-id'] || `sendgrid-${Date.now()}`;

    return {
      messageId,
      response: 'SendGrid email sent successfully',
    };
  }
}
