import { IsEmail, IsISO8601, IsIn, IsInt, IsObject, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class RespondentDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsIn(["female", "male", "non_binary", "prefer_not_to_say"])
  sex?: string;

  @IsOptional()
  @IsInt()
  @Min(13)
  @Max(120)
  age?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  country?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9 ()-]{7,25}$/)
  whatsapp?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  profession?: string;
}

export class SubmitPublicResponseDto {
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^[A-Za-z0-9_-]+$/)
  idempotencyKey?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => RespondentDto)
  respondent?: RespondentDto;

  @IsObject()
  answers!: Record<string, string | string[] | number | boolean>;

  @IsISO8601()
  startedAt!: string;

  @IsISO8601()
  completedAt!: string;
}
