import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as sgMail from '@sendgrid/mail';

// Власна типізація для email результатів
interface EmailResult {
  messageId: string | undefined;
  response: string | undefined;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private useSendGrid: boolean = false;

  constructor() {
    // 🔧 ВИБІР EMAIL ПРОВАЙДЕРА
    if (process.env.SENDGRID_API_KEY) {
      // 📧 SENDGRID для production (Railway)
      this.useSendGrid = true;
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      this.logger.log('📧 Використовується SendGrid для email');
      void this.verifySendGrid();
    } else {
      // 🔧 GMAIL SMTP для локальної розробки
      this.useSendGrid = false;
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // false для port 587
        auth: {
          user: process.env.GMAIL_USER, // Виправлено під Railway variables
          pass: process.env.GMAIL_PASS, // Виправлено під Railway variables
        },
        // 🛡️ Додаткові налаштування для Railway timeout
        connectionTimeout: 60000, // 60 секунд
        greetingTimeout: 30000, // 30 секунд
        socketTimeout: 60000, // 60 секунд
      });
      this.logger.log('📧 Використовується Gmail SMTP для email');
      void this.verifyConnection();
    }
  }

  /**
   * 🧪 ПЕРЕВІРЯЄ ПІДКЛЮЧЕННЯ SendGrid
   */
  private async verifySendGrid(): Promise<void> {
    try {
      // SendGrid не має direct verify, але можемо перевірити API key
      this.logger.log('✅ SendGrid API key налаштовано');
    } catch (error) {
      this.logger.error('❌ Помилка налаштування SendGrid:', error);
    }
  }

  /**
   * 🧪 ПЕРЕВІРЯЄ ПІДКЛЮЧЕННЯ ДО GMAIL SMTP
   */
  private async verifyConnection(): Promise<void> {
    try {
      await this.transporter.verify();
      this.logger.log('✅ Gmail SMTP підключення успішне');
    } catch (error) {
      this.logger.error('❌ Помилка підключення до Gmail SMTP:', error);
      this.logger.warn(
        '⚠️ Email сервіс недоступний - reset password буде повертати токен у відповіді',
      );
    }
  }

  /**
   * 🔄 ВІДПРАВЛЯЄ EMAIL ДЛЯ ВІДНОВЛЕННЯ ПАРОЛЮ
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
      if (this.useSendGrid) {
        return await this.sendViaSendGrid(email, resetToken, userName);
      } else {
        return await this.sendViaGmail(email, resetToken, userName);
      }
    } catch (error) {
      this.logger.error('❌ Помилка відправки email:', error);
      throw error;
    }
  }

  /**
   * 📧 ВІДПРАВКА ЧЕРЕЗ SENDGRID
   */
  private async sendViaSendGrid(
    email: string,
    resetToken: string,
    userName: string,
  ): Promise<EmailResult> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`;

    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@yourapp.com',
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
    this.logger.log(`✅ Email відправлено через SendGrid до ${email}`);
    
    return {
      messageId: result[0].headers['x-message-id'],
      response: 'SendGrid email sent successfully',
    };
  }

  /**
   * 📧 ВІДПРАВКА ЧЕРЕЗ GMAIL SMTP
   */
  private async sendViaGmail(
    email: string,
    resetToken: string,
    userName: string,
  ): Promise<EmailResult> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"Investment Platform" <${process.env.GMAIL_USER}>`,
      to: email,
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

    const info = await this.transporter.sendMail(mailOptions);
    this.logger.log(`✅ Email відправлено через Gmail до ${email}`);
    
    return {
      messageId: info.messageId,
      response: info.response,
    };
  }
}