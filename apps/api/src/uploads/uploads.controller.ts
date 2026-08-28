import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, Headers, HttpCode, Post, Put, Query, Req, Res, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { IsIn, IsInt, IsString, Min } from "class-validator";
import type { Request, Response } from "express";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/jwt-auth.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { LocalStorageService } from "./local-storage.service";
import { UploadsService, type UploadKind } from "./uploads.service";

class SignUploadDto {
  @IsIn(["photo", "sketch", "video"])
  kind!: UploadKind;
  @IsString()
  contentType!: string;
  @IsInt()
  @Min(1)
  contentLength!: number;
}

class ConfirmUploadDto {
  @IsString()
  key!: string;
}

@Controller("uploads")
@ApiTags("uploads")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post("sign")
  sign(@CurrentUser() user: AuthUser, @Body() input: SignUploadDto) {
    return this.uploads.sign(user.id, input);
  }

  @Post("confirm")
  @HttpCode(200)
  confirm(@CurrentUser() user: AuthUser, @Body() input: ConfirmUploadDto) {
    return this.uploads.confirm(user.id, input.key);
  }

  @Delete()
  remove(@CurrentUser() user: AuthUser, @Query("key") key: string) {
    return this.uploads.delete(user.id, key);
  }
}

@Controller("uploads-local")
@ApiTags("uploads")
export class LocalUploadsController {
  constructor(private readonly storage: LocalStorageService) {}

  @Put("upload")
  async upload(
    @Req() req: Request,
    @Query("key") key: string,
    @Query("contentType") contentType: string,
    @Query("contentLength") lengthValue: string,
    @Query("expiresAt") expiresValue: string,
    @Query("token") token: string,
    @Headers("content-type") actualType: string | undefined
  ) {
    const contentLength = Number(lengthValue);
    const expiresAt = Number(expiresValue);
    if (actualType?.split(";", 1)[0] !== contentType || !this.storage.verifyToken(token, key, contentType, contentLength, expiresAt)) {
      throw new ForbiddenException("Invalid or expired upload signature");
    }
    const chunks: Buffer[] = [];
    let received = 0;
    for await (const chunk of req) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      received += buffer.length;
      if (received > contentLength) throw new BadRequestException("Upload exceeds signed contentLength");
      chunks.push(buffer);
    }
    await this.storage.save(key, Buffer.concat(chunks), contentLength);
    return { ok: true, key };
  }

  @Get("get")
  async get(@Query("key") key: string, @Res() response: Response) {
    response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    await this.storage.stream(key, response);
  }
}
