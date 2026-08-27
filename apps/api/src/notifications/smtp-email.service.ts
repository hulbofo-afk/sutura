import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import type { EmailService, PasswordResetEmail, EmailChangeEmail } from "./email.service";

@Injectable()
export class SmtpEmailService implements EmailService {
  private readonly logger = new Logger(SmtpEmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private fromAddress: string;
  private fromName: string;

  constructor(config: ConfigService) {
    this.fromAddress = config.get<string>("SMTP_FROM") ?? "no-reply@suturamode.com";
    this.fromName = config.get<string>("SMTP_FROM_NAME") ?? "Sutura";
  }

  async sendPasswordReset(email: PasswordResetEmail): Promise<void> {
    const transporter = this.getTransporter();
    const html = renderResetHtml(email);
    const text = renderResetText(email);
    await transporter.sendMail({
      from: `${this.fromName} <${this.fromAddress}>`,
      to: email.to,
      subject: "Sutura — Réinitialisation de votre mot de passe",
      html,
      text
    });
  }

  async sendEmailChangeVerification(email: EmailChangeEmail): Promise<void> {
    const transporter = this.getTransporter();
    const html = renderEmailChangeHtml(email);
    const text = renderEmailChangeText(email);
    await transporter.sendMail({
      from: `${this.fromName} <${this.fromAddress}>`,
      to: email.to,
      subject: "Sutura — Confirmez votre nouvelle adresse email",
      html,
      text
    });
  }

  private getTransporter(): nodemailer.Transporter {
    if (this.transporter) return this.transporter;
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host) {
      throw new Error("SMTP_HOST is not set");
    }
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
      tls: { rejectUnauthorized: true, minVersion: "TLSv1.2" },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000
    });
    this.logger.log(`SMTP transport initialised host=${host} port=${port}`);
    return this.transporter;
  }
}

function renderResetText(e: PasswordResetEmail): string {
  return [
    "Sutura — Réinitialisation de mot de passe",
    "",
    "Une demande de réinitialisation a été reçue pour votre compte.",
    `Si vous êtes à l'origine de cette demande, cliquez sur le lien ci-dessous :`,
    e.resetLink,
    "",
    `Ce lien expire dans ${e.expiresInMinutes} minutes.`,
    "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email."
  ].join("\n");
}

function renderResetHtml(e: PasswordResetEmail): string {
  const resetLink = escapeHtml(e.resetLink);
  return `<!doctype html>
<html><body style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:32px auto;color:#1C1A14;">
  <h1 style="color:#C8763A;font-size:22px;margin:0 0 16px;">Sutura</h1>
  <p>Une demande de réinitialisation de mot de passe a été reçue pour votre compte.</p>
  <p>Pour définir un nouveau mot de passe, cliquez sur le bouton ci-dessous.</p>
  <p style="margin:32px 0;">
    <a href="${resetLink}" style="background:#C8763A;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Réinitialiser mon mot de passe</a>
  </p>
  <p style="color:#5C5C5C;font-size:13px;">Ce lien expire dans ${e.expiresInMinutes} minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
</body></html>`;
}

function renderEmailChangeText(e: EmailChangeEmail): string {
  return [
    "Sutura — Confirmation de votre nouvelle adresse email",
    "",
    `Vous (${e.from}) avez demandé à changer votre adresse email pour ${e.to}.`,
    `Si vous êtes à l'origine de cette demande, cliquez sur le lien ci-dessous :`,
    e.link,
    "",
    `Ce lien expire dans ${e.expiresInHours} heures.`,
    "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email."
  ].join("\n");
}

function renderEmailChangeHtml(e: EmailChangeEmail): string {
  const from = escapeHtml(e.from);
  const to = escapeHtml(e.to);
  const link = escapeHtml(e.link);
  return `<!doctype html>
<html><body style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:32px auto;color:#1C1A14;">
  <h1 style="color:#C8763A;font-size:22px;margin:0 0 16px;">Sutura</h1>
  <p>Vous (${from}) avez demandé à changer votre adresse email pour <strong>${to}</strong>.</p>
  <p>Pour confirmer ce changement, cliquez sur le bouton ci-dessous :</p>
  <p style="margin:32px 0;">
    <a href="${link}" style="background:#C8763A;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Confirmer ma nouvelle adresse</a>
  </p>
  <p style="color:#5C5C5C;font-size:13px;">Ce lien expire dans ${e.expiresInHours} heures. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
</body></html>`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[character] as string);
}
