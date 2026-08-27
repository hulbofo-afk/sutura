import { Type, Transform } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = DEFAULT_PAGE;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_LIMIT)
  limit?: number = DEFAULT_LIMIT;

  @IsOptional()
  @IsString()
  sort?: string;
}

export class SearchPaginationDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  search?: string;
}

export class ListFashionTestsDto extends SearchPaginationDto {
  @IsOptional()
  @IsString()
  collectionId?: string;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasMore: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginatedMeta;
}

export function buildMeta(total: number, page: number, limit: number): PaginatedMeta {
  const pages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;
  return {
    total,
    page,
    limit,
    pages,
    hasMore: page < pages
  };
}

export function parseSort(sort: string | undefined, allowed: readonly string[], defaultSort: string): { orderBy: Record<string, "asc" | "desc"> } {
  if (!sort) {
    const [field, dir] = defaultSort.split(":");
    return { orderBy: { [field]: (dir as "asc" | "desc") ?? "asc" } };
  }
  const [rawField, rawDir] = sort.split(":");
  const field = allowed.includes(rawField) ? rawField : defaultSort.split(":")[0];
  const dir = rawDir === "asc" || rawDir === "desc" ? rawDir : "desc";
  return { orderBy: { [field]: dir } };
}
