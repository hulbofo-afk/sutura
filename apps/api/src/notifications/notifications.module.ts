import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { LogEmailService } from "./log-email.service";
import { SmtpEmailService } from "./smtp-email.service";
import { EMAIL_SERVICE, type EmailService } from "./email.service";

@Module({
  providers: [
    LogEmailService,
    SmtpEmailService,
  {
    provide: EMAIL_SERVICE,
    inject: [ConfigService, LogEmailService, SmtpEmailService],
    useFactory: (config: ConfigService, log: LogEmailService, smtp: SmtpEmailService) =>
      config.get<string>("SMTP_HOST") ? smtp : log
  }
  ],
  exports: [EMAIL_SERVICE]
})
export class NotificationsModule {}

export { EMAIL_SERVICE, type EmailService } from "./email.service";
