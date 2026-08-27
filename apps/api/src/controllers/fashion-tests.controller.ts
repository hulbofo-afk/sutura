import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthUser } from "../auth/jwt-auth.guard";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ListFashionTestsDto, SearchPaginationDto } from "../common/pagination";
import {
  CreateFashionTestDto,
  CreateQuestionDto,
  ReorderQuestionsDto,
  TrackShareDto,
  UpdateFashionTestDto,
  UpdateQuestionDto
} from "../dto/fashion-test.dto";
import { FashionTestsService } from "../services/fashion-tests.service";

@Controller()
@ApiTags("fashion-tests")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FashionTestsController {
  constructor(private readonly tests: FashionTestsService) {}

  @Get("fashion-tests")
  @ApiOperation({ summary: "List fashion tests", description: "Returns paginated fashion tests for the authenticated creator, with optional search and collection filter." })
  @ApiResponse({ status: 200, description: "Paginated list of fashion tests" })
  list(@CurrentUser() user: AuthUser, @Query() query: ListFashionTestsDto) {
    return this.tests.list(user.id, {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      sort: query.sort ?? "createdAt:desc",
      search: query.search,
      collectionId: query.collectionId
    });
  }

  @Post("collections/:collectionId/fashion-tests")
  @ApiOperation({ summary: "Create a fashion test", description: "Creates a new fashion test within a collection with optional settings." })
  @ApiResponse({ status: 201, description: "Fashion test created" })
  @ApiBody({ type: CreateFashionTestDto })
  create(
    @CurrentUser() user: AuthUser,
    @Param("collectionId") collectionId: string,
    @Body() input: CreateFashionTestDto
  ) {
    return this.tests.create(user.id, collectionId, input);
  }

  @Get("fashion-tests/:testId")
  @ApiOperation({ summary: "Get a fashion test", description: "Returns a fashion test with its questions and settings." })
  @ApiResponse({ status: 200, description: "Fashion test data" })
  @ApiResponse({ status: 404, description: "Test not found or access denied" })
  get(@CurrentUser() user: AuthUser, @Param("testId") testId: string) {
    return this.tests.get(user.id, testId);
  }

  @Patch("fashion-tests/:testId")
  @ApiOperation({ summary: "Update a fashion test", description: "Updates the title, description, or settings of an existing fashion test." })
  @ApiResponse({ status: 200, description: "Fashion test updated" })
  @ApiResponse({ status: 404, description: "Test not found or access denied" })
  @ApiBody({ type: UpdateFashionTestDto })
  update(
    @CurrentUser() user: AuthUser,
    @Param("testId") testId: string,
    @Body() input: UpdateFashionTestDto
  ) {
    return this.tests.update(user.id, testId, input);
  }

  @Post("fashion-tests/:testId/publish")
  @ApiOperation({ summary: "Publish a fashion test", description: "Publishes a test so it becomes accessible via public URL. Requires at least one model in the collection." })
  @ApiResponse({ status: 201, description: "Test published with public URL" })
  @ApiResponse({ status: 400, description: "Validation failed (missing models, etc.)" })
  publish(@CurrentUser() user: AuthUser, @Param("testId") testId: string) {
    return this.tests.publish(user.id, testId);
  }

  @Post("fashion-tests/:testId/close")
  @ApiOperation({ summary: "Close a fashion test", description: "Closes a published test so no more responses are accepted." })
  @ApiResponse({ status: 201, description: "Test closed" })
  close(@CurrentUser() user: AuthUser, @Param("testId") testId: string) {
    return this.tests.close(user.id, testId);
  }

  @Post("fashion-tests/:testId/questions")
  @ApiOperation({ summary: "Add a question", description: "Adds a new question to a fashion test (single_choice, scale, rating, yes_no, price, etc.)." })
  @ApiResponse({ status: 201, description: "Question created" })
  @ApiBody({ type: CreateQuestionDto })
  addQuestion(
    @CurrentUser() user: AuthUser,
    @Param("testId") testId: string,
    @Body() input: CreateQuestionDto
  ) {
    return this.tests.addQuestion(user.id, testId, input);
  }

  @Patch("fashion-tests/:testId/questions/:questionId")
  @ApiOperation({ summary: "Update a question", description: "Updates one or more fields of an existing question." })
  @ApiResponse({ status: 200, description: "Question updated" })
  @ApiResponse({ status: 404, description: "Question not found or access denied" })
  @ApiBody({ type: UpdateQuestionDto })
  updateQuestion(
    @CurrentUser() user: AuthUser,
    @Param("testId") testId: string,
    @Param("questionId") questionId: string,
    @Body() input: UpdateQuestionDto
  ) {
    return this.tests.updateQuestion(user.id, testId, questionId, input);
  }

  @Delete("fashion-tests/:testId/questions/:questionId")
  @ApiOperation({ summary: "Delete a question", description: "Permanently removes a question from a fashion test." })
  @ApiResponse({ status: 200, description: "Question deleted" })
  @ApiResponse({ status: 404, description: "Question not found or access denied" })
  deleteQuestion(
    @CurrentUser() user: AuthUser,
    @Param("testId") testId: string,
    @Param("questionId") questionId: string
  ) {
    return this.tests.deleteQuestion(user.id, testId, questionId);
  }

  @Post("fashion-tests/:testId/questions/reorder")
  @ApiOperation({ summary: "Reorder questions", description: "Sets the display order of questions within a fashion test." })
  @ApiResponse({ status: 201, description: "Questions reordered" })
  @ApiBody({ type: ReorderQuestionsDto })
  reorderQuestions(
    @CurrentUser() user: AuthUser,
    @Param("testId") testId: string,
    @Body() input: ReorderQuestionsDto
  ) {
    return this.tests.reorderQuestions(user.id, testId, input.questionIds);
  }

  @Get("fashion-tests/:testId/share")
  @ApiOperation({ summary: "Get share payload", description: "Returns the public URL and sharing data for a published fashion test." })
  @ApiResponse({ status: 200, description: "Share payload with publicUrl" })
  share(@CurrentUser() user: AuthUser, @Param("testId") testId: string) {
    return this.tests.sharePayload(user.id, testId);
  }

  @Post("fashion-tests/:testId/share-events")
  @ApiOperation({ summary: "Track a share event", description: "Records when a test was shared on a specific channel (whatsapp, facebook, instagram, tiktok, copy_link)." })
  @ApiResponse({ status: 201, description: "Share event tracked" })
  @ApiBody({ type: TrackShareDto })
  trackShare(
    @CurrentUser() user: AuthUser,
    @Param("testId") testId: string,
    @Body() input: TrackShareDto
  ) {
    return this.tests.trackShare(user.id, testId, input);
  }
}
