import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { PrismaService } from "../services/prisma.service";

export interface AuthUser {
  id: string;
  email: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const token = this.extractBearerToken(request);
    if (!token) throw new UnauthorizedException("Missing bearer token");

    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; email: string; sv: number }>(token);
      if (!payload.sub || !Number.isInteger(payload.sv)) throw new Error("Invalid token payload");
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, status: true, sessionVersion: true }
      });
      if (!user || user.status !== "active" || user.sessionVersion !== payload.sv) {
        throw new Error("Session revoked");
      }
      request.user = { id: user.id, email: user.email };
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired bearer token");
    }
  }

  private extractBearerToken(request: Request) {
    const authorization = request.headers.authorization;
    if (!authorization) return null;
    const [type, token] = authorization.split(" ");
    return type?.toLowerCase() === "bearer" && token ? token : null;
  }
}
