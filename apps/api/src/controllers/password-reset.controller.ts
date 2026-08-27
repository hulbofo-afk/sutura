import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Body, Controller, Get, HttpCode, Post, Query } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { ForgotPasswordDto, ResetPasswordDto } from "../dto/password-reset.dto";
import { PasswordResetService } from "../services/password-reset.service";

@Controller("auth")
@ApiTags("auth")
export class PasswordResetController {
  constructor(private readonly resets: PasswordResetService) {}

  @Throttle({ medium: { limit: 5, ttl: 60_000 }, long: { limit: 20, ttl: 3_600_000 } })
  @Post("forgot-password")
  @HttpCode(200)
  @ApiOperation({ summary: "Request a password reset link", description: "Sends a password reset email with a token. Returns 200 even for unknown emails to prevent enumeration." })
  @ApiResponse({ status: 200, description: "Reset link sent (if email exists)" })
  @ApiBody({ type: ForgotPasswordDto })
  async forgot(@Body() dto: ForgotPasswordDto) {
    await this.resets.requestReset(dto.email);
    return { ok: true };
  }

  @Throttle({ medium: { limit: 10, ttl: 60_000 } })
  @Post("reset-password")
  @HttpCode(200)
  @ApiOperation({ summary: "Consume a reset token and set new password", description: "Validates the token and updates the user's password." })
  @ApiResponse({ status: 200, description: "Password reset successfully" })
  @ApiResponse({ status: 400, description: "Invalid or expired token" })
  @ApiBody({ type: ResetPasswordDto })
  async reset(@Body() dto: ResetPasswordDto) {
    await this.resets.consumeReset(dto.token, dto.newPassword);
    return { ok: true };
  }

  @Get("reset-password/validate")
  @ApiOperation({ summary: "Check if a reset token is still valid", description: "Returns { valid: boolean } for a given reset token." })
  @ApiResponse({ status: 200, description: "Token validity status" })
  async validate(@Query("token") token: string) {
    const valid = await this.resets.isTokenValid(token);
    return { valid };
  }
}
