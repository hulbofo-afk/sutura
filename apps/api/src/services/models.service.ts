import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import { CreateFashionModelDto, UpdateFashionModelDto } from "../dto/model.dto";
import { normalizePhotoUrls, normalizeImageUrl } from "../common/normalize-image";
import { findOwnedCollection, findOwnedModel } from "./ownership";
import { mapModel } from "./mappers";
import { PrismaService } from "./prisma.service";
import type { FashionModel } from "../types";
import { UploadsService } from "../uploads/uploads.service";

@Injectable()
export class ModelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService
  ) {}

  async list(creatorId: string, collectionId: string): Promise<FashionModel[]> {
    await findOwnedCollection(this.prisma, creatorId, collectionId);
    const models = await this.prisma.fashionModel.findMany({
      where: { collectionId },
      orderBy: { sortOrder: "asc" }
    });
    return models.map(mapModel);
  }

  async create(creatorId: string, collectionId: string, input: CreateFashionModelDto): Promise<FashionModel> {
    await findOwnedCollection(this.prisma, creatorId, collectionId);
    await this.uploads.assertOwnedPublicUrls(creatorId, input);
    const normalizedInput = {
      ...input,
      photoUrls: normalizePhotoUrls(input.photoUrls),
      sketchUrl: input.sketchUrl ? normalizeImageUrl(input.sketchUrl) : undefined,
      videoUrl: input.videoUrl ? normalizeImageUrl(input.videoUrl) : undefined
    };
    const sortOrder = (await this.prisma.fashionModel.count({ where: { collectionId } })) + 1;
    const model = await this.prisma.fashionModel.create({
      data: {
        collectionId,
        name: normalizedInput.name,
        description: normalizedInput.description,
        photoUrls: normalizedInput.photoUrls,
        sketchUrl: normalizedInput.sketchUrl,
        videoUrl: normalizedInput.videoUrl,
        colors: normalizedInput.colors,
        desiredPrice: normalizedInput.desiredPrice,
        sortOrder
      }
    });
    return mapModel(model);
  }

  async update(
    creatorId: string,
    collectionId: string,
    modelId: string,
    input: UpdateFashionModelDto
  ): Promise<FashionModel> {
    await findOwnedModel(this.prisma, creatorId, collectionId, modelId);
    await this.uploads.assertOwnedPublicUrls(creatorId, input);
    const normalized: Record<string, unknown> = {};
    if (input.name !== undefined) normalized.name = input.name;
    if (input.description !== undefined) normalized.description = input.description;
    if (input.photoUrls !== undefined) normalized.photoUrls = normalizePhotoUrls(input.photoUrls);
    if (input.sketchUrl !== undefined) normalized.sketchUrl = input.sketchUrl ? normalizeImageUrl(input.sketchUrl) : input.sketchUrl;
    if (input.videoUrl !== undefined) normalized.videoUrl = input.videoUrl ? normalizeImageUrl(input.videoUrl) : input.videoUrl;
    if (input.colors !== undefined) normalized.colors = input.colors;
    if (input.desiredPrice !== undefined) normalized.desiredPrice = input.desiredPrice;
    const model = await this.prisma.fashionModel.update({
      where: { id: modelId },
      data: normalized
    });
    return mapModel(model);
  }

  async delete(creatorId: string, collectionId: string, modelId: string): Promise<{ deleted: true; modelId: string }> {
    await findOwnedModel(this.prisma, creatorId, collectionId, modelId);
    const references = await this.prisma.question.count({ where: { modelId } });
    if (references > 0) {
      throw new ConflictException("Model is referenced by questionnaire questions and cannot be deleted");
    }
    await this.prisma.fashionModel.delete({ where: { id: modelId } });
    const remaining = await this.prisma.fashionModel.findMany({
      where: { collectionId },
      orderBy: { sortOrder: "asc" }
    });
    await this.reorder(creatorId, collectionId, remaining.map((model) => model.id));
    return { deleted: true, modelId };
  }

  async reorder(creatorId: string, collectionId: string, modelIds: string[]): Promise<FashionModel[]> {
    await findOwnedCollection(this.prisma, creatorId, collectionId);
    const current = await this.prisma.fashionModel.findMany({ where: { collectionId } });
    if (current.length !== modelIds.length || current.some((model) => !modelIds.includes(model.id))) {
      throw new BadRequestException("modelIds must contain every model for this collection exactly once");
    }
    await this.prisma.$transaction(
      modelIds.map((id, index) =>
        this.prisma.fashionModel.update({ where: { id }, data: { sortOrder: index + 1 } })
      )
    );
    return this.list(creatorId, collectionId);
  }
}
