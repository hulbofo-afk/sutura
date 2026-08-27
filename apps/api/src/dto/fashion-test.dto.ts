import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ArrayMaxSize,
  ArrayMinSize,
  Max,
  MaxLength,
  MinLength,
  Min,
  ValidateNested
} from "class-validator";
import { Type } from "class-transformer";
import type { QuestionType, RespondentProfile } from "../types";

export const questionTypes: QuestionType[] = [
  "single_choice",
  "multiple_choice",
  "scale",
  "rating",
  "yes_no",
  "price",
  "short_text",
  "paragraph",
  "ranking"
];

class TestSettingsDto {
  @IsOptional()
  @IsBoolean()
  randomizeQuestions?: boolean;

  @IsOptional()
  @IsBoolean()
  requireAllQuestions?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  completionMessage?: string;

  @IsOptional()
  @IsDateString()
  closesAt?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1_000_000)
  maxResponses?: number;

  @IsOptional()
  @IsBoolean()
  anonymousResponses?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsIn(["firstName", "sex", "age", "city", "country", "whatsapp", "email", "profession"], { each: true })
  collectRespondentProfile?: Array<keyof RespondentProfile>;
}

export class CreateFashionTestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  description?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TestSettingsDto)
  settings?: TestSettingsDto;
}

export class UpdateFashionTestDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  description?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TestSettingsDto)
  settings?: TestSettingsDto;
}

export class CreateQuestionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  text!: string;

  @IsIn(questionTypes)
  type!: QuestionType;

  @IsBoolean()
  required!: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  options?: string[];

  @IsOptional()
  @IsNumber()
  min?: number;

  @IsOptional()
  @IsNumber()
  max?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  helpText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  modelId?: string;
}

export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  text?: string;

  @IsOptional()
  @IsIn(questionTypes)
  type?: QuestionType;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  options?: string[];

  @IsOptional()
  @IsNumber()
  min?: number;

  @IsOptional()
  @IsNumber()
  max?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  helpText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  modelId?: string;
}

export class ReorderQuestionsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @IsString({ each: true })
  questionIds!: string[];
}

export class TrackShareDto {
  @IsIn(["whatsapp", "facebook", "instagram", "tiktok", "copy_link"])
  channel!: "whatsapp" | "facebook" | "instagram" | "tiktok" | "copy_link";
}
