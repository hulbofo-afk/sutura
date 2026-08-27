import { Injectable, Logger } from "@nestjs/common";
import type { EmailService, PasswordResetEmail, EmailChangeEmail } from "./email.service";

@Injectable()
export class LogEmailService implements EmailService {
  private readonly logger = new Logger(LogEmailService.name);

  async sendPasswordReset(email: PasswordResetEmail): Promise<void> {
    this.logger.warn(
      `[DEV] Password reset for ${email.to} → ${email.resetLink} (expires in ${email.expiresInMinutes}min)`
    );
  }

  async sendEmailChangeVerification(email: EmailChangeEmail): Promise<void> {
    this.logger.warn(
      `[DEV] Email change verification for ${email.to} (from ${email.from}) → ${email.link} (expires in ${email.expiresInHours}h)`
    );
  }
}
