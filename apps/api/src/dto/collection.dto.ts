import { PartialType } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateCollectionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  season?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  targetAudience?: string;

  @IsOptional()
  @IsDateString()
  launchDate?: string;
}

export class UpdateCollectionDto extends PartialType(CreateCollectionDto) {}
