import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Body, Controller, Delete, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/jwt-auth.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateFashionModelDto, ReorderModelsDto, UpdateFashionModelDto } from "../dto/model.dto";
import { ModelsService } from "../services/models.service";

@Controller("collections/:collectionId/models")
@ApiTags("models")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ModelsController {
  constructor(private readonly models: ModelsService) {}

  @Post()
  @ApiOperation({ summary: "Add a model to a collection", description: "Creates a new fashion model (garment) within a collection with photos, colors, and optional price." })
  @ApiResponse({ status: 201, description: "Model created" })
  @ApiBody({ type: CreateFashionModelDto })
  create(
    @CurrentUser() user: AuthUser,
    @Param("collectionId") collectionId: string,
    @Body() input: CreateFashionModelDto
  ) {
    return this.models.create(user.id, collectionId, input);
  }

  @Patch(":modelId")
  @ApiOperation({ summary: "Update a model", description: "Updates one or more fields of an existing fashion model." })
  @ApiResponse({ status: 200, description: "Model updated" })
  @ApiResponse({ status: 404, description: "Model not found or access denied" })
  @ApiBody({ type: UpdateFashionModelDto })
  update(
    @CurrentUser() user: AuthUser,
    @Param("collectionId") collectionId: string,
    @Param("modelId") modelId: string,
    @Body() input: UpdateFashionModelDto
  ) {
    return this.models.update(user.id, collectionId, modelId, input);
  }

  @Delete(":modelId")
  @ApiOperation({ summary: "Delete a model", description: "Permanently deletes a fashion model from its collection." })
  @ApiResponse({ status: 200, description: "Model deleted" })
  @ApiResponse({ status: 404, description: "Model not found or access denied" })
  delete(
    @CurrentUser() user: AuthUser,
    @Param("collectionId") collectionId: string,
    @Param("modelId") modelId: string
  ) {
    return this.models.delete(user.id, collectionId, modelId);
  }

  @Post("reorder")
  @ApiOperation({ summary: "Reorder models", description: "Sets the display order of models within a collection." })
  @ApiResponse({ status: 201, description: "Models reordered" })
  @ApiBody({ type: ReorderModelsDto })
  reorder(
    @CurrentUser() user: AuthUser,
    @Param("collectionId") collectionId: string,
    @Body() input: ReorderModelsDto
  ) {
    return this.models.reorder(user.id, collectionId, input.modelIds);
  }
}
