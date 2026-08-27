import { ArrayMaxSize, ArrayMinSize, IsArray, IsNumber, IsOptional, IsString, Max, MaxLength, Min, MinLength } from "class-validator";

export class CreateFashionModelDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  description?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(2_048, { each: true })
  photoUrls!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(2_048)
  sketchUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_048)
  videoUrl?: string;

  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  colors!: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1_000_000_000)
  desiredPrice?: number;
}

export class UpdateFashionModelDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  description?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(2_048, { each: true })
  photoUrls?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(2_048)
  sketchUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_048)
  videoUrl?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  colors?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1_000_000_000)
  desiredPrice?: number;
}

export class ReorderModelsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @IsString({ each: true })
  modelIds!: string[];
}
