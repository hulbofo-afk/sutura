import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MinLength, MaxLength, Matches } from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "Samsiath Yacoubou" })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: "Sutura Studio" })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  brandName!: string;

  @ApiProperty({ example: "creator@sutura.app" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "password123", minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiProperty({ required: false, example: "Cotonou" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @ApiProperty({ required: false, example: "Benin" })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  country?: string;
}

export class LoginDto {
  @ApiProperty({ example: "creator@sutura.app" })
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(128)
  password!: string;
}

export class RefreshDto {
  @ApiProperty({ description: "Refresh token returned by /auth/register or /auth/login" })
  @IsString()
  @MinLength(32)
  @MaxLength(256)
  @Matches(/^[A-Za-z0-9_-]+$/, { message: "refresh token must be alphanumeric" })
  refreshToken!: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  currentPassword!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;
}

export class RequestEmailChangeDto {
  @ApiProperty({ example: "new-email@example.com" })
  @IsEmail()
  newEmail!: string;
}

export class ConfirmEmailChangeDto {
  @ApiProperty({ description: "Token sent by email to the new address" })
  @IsString()
  @MinLength(16)
  @MaxLength(256)
  token!: string;
}
