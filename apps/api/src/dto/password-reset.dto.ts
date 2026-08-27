import { IsEmail, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class ForgotPasswordDto {
  @IsEmail()
  @MaxLength(255)
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(16)
  @MaxLength(256)
  @Matches(/^[A-Za-z0-9_-]+$/, { message: "token must be alphanumeric" })
  token!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;
}
