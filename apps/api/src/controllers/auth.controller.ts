import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Body, Controller, Get, HttpCode, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { SkipThrottle, Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { AuthUser } from "../auth/jwt-auth.guard";
import { ChangePasswordDto, ConfirmEmailChangeDto, RefreshDto, RequestEmailChangeDto, UpdateProfileDto } from "../dto/auth.dto";
import { LoginDto, RegisterDto } from "../dto/auth.dto";
import { AuthService } from "../services/auth.service";

function clientIp(req: Request): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) return fwd.split(",")[0].trim();
  return req.ip ?? req.socket?.remoteAddress ?? "unknown";
}

function userAgent(req: Request): string | undefined {
  const ua = req.headers["user-agent"];
  return typeof ua === "string" ? ua : undefined;
}

@Controller("auth")
@ApiTags("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Throttle({ medium: { limit: 10, ttl: 60_000 }, long: { limit: 30, ttl: 3_600_000 } })
  @Post("register")
  @ApiOperation({ summary: "Register a new creator account", description: "Creates a new user with email, password, name, brand name, and optional city/country. Returns JWT token + refresh token." })
  @ApiResponse({ status: 201, description: "Account created successfully" })
  @ApiResponse({ status: 409, description: "Email already registered" })
  @ApiBody({ type: RegisterDto })
  async register(@Body() input: RegisterDto, @Req() req: Request) {
    return this.auth.register(input, { ip: clientIp(req), userAgent: userAgent(req) });
  }

  @Throttle({ short: { limit: 5, ttl: 60_000 }, medium: { limit: 10, ttl: 60_000 } })
  @Post("login")
  @ApiOperation({ summary: "Log in with email and password", description: "Authenticates the user and returns JWT token + refresh token. Account locks after 5 failed attempts for 15 minutes." })
  @ApiResponse({ status: 201, description: "Login successful" })
  @ApiResponse({ status: 401, description: "Invalid email or password" })
  @ApiResponse({ status: 403, description: "Account locked due to too many failed attempts" })
  @ApiBody({ type: LoginDto })
  async login(@Body() input: LoginDto, @Req() req: Request) {
    return this.auth.login(input, { ip: clientIp(req), userAgent: userAgent(req) });
  }

  @Throttle({ medium: { limit: 60, ttl: 60_000 } })
  @Post("refresh")
  @HttpCode(200)
  @ApiOperation({ summary: "Refresh access token", description: "Exchanges a valid refresh token for a new JWT access token + new refresh token (rotation)." })
  @ApiResponse({ status: 200, description: "Tokens refreshed" })
  @ApiResponse({ status: 401, description: "Invalid or revoked refresh token" })
  @ApiBody({ type: RefreshDto })
  async refresh(@Body() dto: RefreshDto, @Req() req: Request) {
    return this.auth.refresh(dto.refreshToken, { ip: clientIp(req), userAgent: userAgent(req) });
  }

  @SkipThrottle()
  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user profile", description: "Returns the authenticated user's profile information." })
  @ApiResponse({ status: 200, description: "User profile" })
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }

  @Patch("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update current creator profile" })
  @ApiResponse({ status: 200, description: "Profile updated" })
  updateMe(@CurrentUser() user: AuthUser, @Body() input: UpdateProfileDto) {
    return this.auth.updateProfile(user.id, input);
  }

  @Throttle({ medium: { limit: 5, ttl: 60_000 } })
  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Log out", description: "Revokes all refresh tokens for the authenticated user." })
  @ApiResponse({ status: 200, description: "Logged out successfully" })
  async logout(@CurrentUser() user: AuthUser) {
    await this.auth.logout(user.id);
    return { ok: true };
  }

  @Throttle({ medium: { limit: 5, ttl: 60_000 } })
  @Post("change-password")
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Change password", description: "Changes the current password. Requires the current password and a new password (min 8 chars). Revokes all refresh tokens." })
  @ApiResponse({ status: 200, description: "Password changed" })
  @ApiResponse({ status: 401, description: "Current password is incorrect" })
  @ApiBody({ type: ChangePasswordDto })
  async changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    await this.auth.changePassword(user.id, dto.currentPassword, dto.newPassword);
    return { ok: true };
  }

  @Throttle({ medium: { limit: 3, ttl: 60_000 } })
  @Post("change-email/request")
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Request email change", description: "Sends a verification token to the new email address." })
  @ApiResponse({ status: 200, description: "Verification email sent" })
  @ApiBody({ type: RequestEmailChangeDto })
  async requestEmailChange(@CurrentUser() user: AuthUser, @Body() dto: RequestEmailChangeDto) {
    await this.auth.requestEmailChange(user.id, dto.newEmail);
    return { ok: true };
  }

  @Throttle({ medium: { limit: 5, ttl: 60_000 } })
  @Post("change-email/confirm")
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Confirm email change", description: "Confirms the email change with the token received via email." })
  @ApiResponse({ status: 200, description: "Email changed successfully" })
  @ApiResponse({ status: 400, description: "Invalid or expired token" })
  @ApiBody({ type: ConfirmEmailChangeDto })
  async confirmEmailChange(@CurrentUser() user: AuthUser, @Body() dto: ConfirmEmailChangeDto) {
    await this.auth.confirmEmailChange(user.id, dto.token);
    return { ok: true };
  }
}
