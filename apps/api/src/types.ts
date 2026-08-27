export type TestStatus = "draft" | "published" | "closed" | "archived";

export type QuestionType =
  | "single_choice"
  | "multiple_choice"
  | "scale"
  | "rating"
  | "yes_no"
  | "price"
  | "short_text"
  | "paragraph"
  | "ranking";

export interface CreatorProfile {
  id: string;
  name: string;
  brandName: string;
  email: string;
  city?: string;
  country?: string;
}

export interface Collection {
  id: string;
  creatorId: string;
  title: string;
  description?: string;
  season?: string;
  category?: string;
  targetAudience?: string;
  launchDate?: string;
  status: TestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FashionModel {
  id: string;
  collectionId: string;
  name: string;
  description?: string;
  photoUrls: string[];
  sketchUrl?: string;
  videoUrl?: string;
  colors: string[];
  desiredPrice?: number;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface FashionQuestion {
  id: string;
  testId: string;
  text: string;
  type: QuestionType;
  required: boolean;
  options: string[];
  min?: number;
  max?: number;
  sortOrder: number;
  helpText?: string;
  modelId?: string;
}

export interface FashionTestSettings {
  randomizeQuestions: boolean;
  requireAllQuestions: boolean;
  completionMessage: string;
  closesAt?: string;
  maxResponses?: number;
  anonymousResponses: boolean;
  collectRespondentProfile: Array<keyof RespondentProfile>;
}

export interface FashionTest {
  id: string;
  collectionId: string;
  slug: string;
  title: string;
  description?: string;
  status: TestStatus;
  settings: FashionTestSettings;
  createdAt: string;
  updatedAt: string;
}

export interface RespondentProfile {
  firstName?: string;
  sex?: string;
  age?: number;
  city?: string;
  country?: string;
  whatsapp?: string;
  email?: string;
  profession?: string;
}

export interface PublicResponse {
  id: string;
  testId: string;
  respondent?: RespondentProfile;
  answers: Record<string, string | string[] | number | boolean>;
  startedAt: string;
  completedAt: string;
  createdAt: string;
}

export type ShareChannel = "whatsapp" | "facebook" | "instagram" | "tiktok" | "copy_link";

export interface ShareEvent {
  id: string;
  testId: string;
  channel: ShareChannel;
  createdAt: string;
}
