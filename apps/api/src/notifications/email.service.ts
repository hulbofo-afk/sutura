export interface PasswordResetEmail {
  to: string;
  resetLink: string;
  expiresInMinutes: number;
}

export interface EmailChangeEmail {
  to: string;
  from: string;
  link: string;
  expiresInHours: number;
}

export interface EmailService {
  sendPasswordReset(email: PasswordResetEmail): Promise<void>;
  sendEmailChangeVerification(email: EmailChangeEmail): Promise<void>;
}

export const EMAIL_SERVICE = Symbol("EmailService");
