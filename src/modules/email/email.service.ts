import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

// Власна типізація для email результатів
interface EmailResult {
  messageId: string | undefined;
  response: string | undefined;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    // 🔧 НАЛАШТУВАННЯ GMAIL SMTP
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

    // 🧪 ПЕРЕВІРКА ПІДКЛЮЧЕННЯ ПРИ ЗАПУСКУ
    void this.verifyConnection();
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
   * @param resetToken - Токен для відновлення паролю
   * @param frontendUrl - URL фронтенду (за замовчуванням localhost:3000)
   */
  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    frontendUrl: string = 'http://localhost:3000',
  ): Promise<boolean> {
    try {
      const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
      const mailOptions = {
        from: {
          name: '🏦 Investment Platform',
          address: process.env.GMAIL_EMAIL || 'noreply@investmentplatform.com',
        },
        to: email,
        subject: '🔐 Відновлення паролю - Investment Platform',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Відновлення паролю</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #4CAF50; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { 
                display: inline-block; 
                background: #4CAF50; 
                color: white; 
                padding: 12px 25px; 
                text-decoration: none; 
                border-radius: 5px; 
                font-weight: bold;
                margin: 20px 0;
              }
              .warning { color: #ff6b6b; font-size: 14px; margin-top: 20px; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Відновлення паролю</h1>
              </div>
              <div class="content">
                <p>Привіт!</p>
                <p>Ми отримали запит на відновлення паролю для вашого акаунту в <strong>Investment Platform</strong>.</p>
                
                <p>Натисніть кнопку нижче, щоб створити новий пароль:</p>
                <a href="${resetLink}" class="button">📝 Створити новий пароль</a>
                
                <p>Або скопіюйте це посилання у браузер:</p>
                <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 4px;">
                  <code>${resetLink}</code>
                </p>
                
                <div class="warning">
                  ⚠️ <strong>Важливо:</strong><br>
                  • Посилання дійсне лише <strong>15 хвилин</strong><br>
                  • Якщо ви не робили цей запит, проігноруйте цей email<br>
                  • Ніколи не передавайте це посилання іншим людям
                </div>
              </div>
              <div class="footer">
                <p>© 2024 Investment Platform. Всі права захищені.</p>
                <p>Цей email відправлений автоматично, не відповідайте на нього.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        // 📝 Текстова версія для клієнтів без HTML
        text: `Відновлення паролю - Investment Platform

Привіт!

Ми отримали запит на відновлення паролю для вашого акаунту.

Перейдіть за цим посиланням щоб створити новий пароль:
${resetLink}

УВАГА: Посилання дійсне лише 15 хвилин.
Якщо ви не робили цей запит, проігноруйте цей email.

© 2024 Investment Platform`,
      };

      const info = (await this.transporter.sendMail(
        mailOptions,
      )) as EmailResult;

      this.logger.log(`✅ Reset email відправлений на ${email}`, {
        messageId: info.messageId || 'unknown',
        response: info.response || 'success',
      });
      return true;
    } catch (error) {
      this.logger.error(`❌ Помилка відправки reset email на ${email}:`, error);
      return false;
    }
  }

  /**
   * 🧪 ТЕСТОВИЙ МЕТОД ДЛЯ ПЕРЕВІРКИ EMAIL СЕРВІСУ
   */
  async sendTestEmail(toEmail: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: {
          name: '🧪 Test Email',
          address: process.env.GMAIL_EMAIL || 'test@investmentplatform.com',
        },
        to: toEmail,
        subject: '🧪 Тест Email сервісу',
        html: `
          <h2>✅ Email сервіс працює!</h2>
          <p>Цей email підтверджує що Gmail SMTP налаштований правильно.</p>
          <p><em>Відправлено: ${new Date().toLocaleString('uk-UA')}</em></p>
        `,
        text:
          'Email сервіс працює! Відправлено: ' +
          new Date().toLocaleString('uk-UA'),
      };

      const info = (await this.transporter.sendMail(
        mailOptions,
      )) as EmailResult;
      this.logger.log(`✅ Тестовий email відправлений на ${toEmail}`, {
        messageId: info.messageId || 'unknown',
      });
      return true;
    } catch (error) {
      this.logger.error(`❌ Помилка відправки тестового email:`, error);
      return false;
    }
  }
}
