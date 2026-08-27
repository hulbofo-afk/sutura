import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/jwt-auth.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { SearchPaginationDto } from "../common/pagination";
import { CreateCollectionDto, UpdateCollectionDto } from "../dto/collection.dto";
import { CollectionsService } from "../services/collections.service";

@Controller("collections")
@ApiTags("collections")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CollectionsController {
  constructor(private readonly collections: CollectionsService) {}

  @Get()
  @ApiOperation({ summary: "List collections", description: "Returns paginated collections for the authenticated creator, with optional search and sort." })
  @ApiResponse({ status: 200, description: "Paginated list of collections" })
  list(@CurrentUser() user: AuthUser, @Query() query: SearchPaginationDto) {
    return this.collections.list(user.id, {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      sort: query.sort ?? "createdAt:desc",
      search: query.search
    });
  }

  @Post()
  @ApiOperation({ summary: "Create a collection", description: "Creates a new fashion collection for the authenticated creator." })
  @ApiResponse({ status: 201, description: "Collection created" })
  @ApiBody({ type: CreateCollectionDto })
  create(@CurrentUser() user: AuthUser, @Body() input: CreateCollectionDto) {
    return this.collections.create(user.id, input);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a collection", description: "Updates one or more fields of an existing collection." })
  @ApiResponse({ status: 200, description: "Collection updated" })
  @ApiResponse({ status: 404, description: "Collection not found or access denied" })
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() input: UpdateCollectionDto) {
    return this.collections.update(user.id, id, input);
  }

  @Post(":id/archive")
  @ApiOperation({ summary: "Archive a collection", description: "Archives (soft-deletes) a collection and all its contents." })
  @ApiResponse({ status: 201, description: "Collection archived" })
  archive(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.collections.archive(user.id, id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get collection with children", description: "Returns a collection with its models and tests." })
  @ApiResponse({ status: 200, description: "Collection with models and tests" })
  @ApiResponse({ status: 404, description: "Collection not found or access denied" })
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.collections.getWithChildren(user.id, id);
  }
}
