import type {
  Collection,
  CreatorProfile,
  FashionModel,
  FashionQuestion,
  FashionTest,
  PublicResponse
} from "../types";

const now = new Date("2026-07-23T10:00:00.000Z").toISOString();

export const creator: CreatorProfile = {
  id: "creator_demo",
  name: "Samsiath Yacoubou",
  brandName: "Sutura Studio",
  email: "creator@sutura.app",
  city: "Cotonou",
  country: "Benin"
};

export const collections: Collection[] = [
  {
    id: "collection_rose",
    creatorId: creator.id,
    title: "Rose Cotonou",
    description: "Collection beta pour valider les pieces avant production.",
    season: "Rentrée 2026",
    category: "Pret-a-porter",
    targetAudience: "Femmes urbaines 22-35 ans",
    launchDate: "2026-09-15",
    status: "published",
    createdAt: now,
    updatedAt: now
  },
  {
    id: "collection_indigo",
    creatorId: creator.id,
    title: "Nuit Indigo",
    description: "Capsule plus sobre en cours de preparation.",
    season: "Harmattan 2026",
    category: "Capsule",
    targetAudience: "Jeunes actifs premium",
    status: "draft",
    createdAt: now,
    updatedAt: now
  }
];

export const models: FashionModel[] = [
  {
    id: "model_veste",
    collectionId: "collection_rose",
    name: "Veste Sika",
    description: "Veste structuree avec details wax subtils.",
    photoUrls: ["/brand/assets/hero-visual.jpg"],
    colors: ["#E91E63", "#C8763A", "#2A2A2A"],
    desiredPrice: 45000,
    sortOrder: 1
  },
  {
    id: "model_robe",
    collectionId: "collection_rose",
    name: "Robe Mina",
    description: "Robe droite pour sorties et evenements.",
    photoUrls: ["/brand/assets/hero-visual.jpg"],
    colors: ["#E91E63", "#FFFFFF"],
    desiredPrice: 38000,
    sortOrder: 2
  }
];

export const tests: FashionTest[] = [
  {
    id: "test_rose",
    collectionId: "collection_rose",
    slug: "rose-cotonou",
    title: "Aide-nous a choisir les pieces a produire",
    description: "Trois minutes pour dire ce que tu porterais vraiment.",
    status: "published",
    settings: {
      randomizeQuestions: false,
      requireAllQuestions: true,
      completionMessage: "Merci, ton avis aide le createur a produire juste.",
      anonymousResponses: true,
      collectRespondentProfile: ["firstName", "sex", "age", "city", "country", "whatsapp", "email", "profession"],
      maxResponses: 500
    },
    createdAt: now,
    updatedAt: now
  }
];

export const questions: FashionQuestion[] = [
  {
    id: "q_choice",
    testId: "test_rose",
    text: "Quel modele porterais-tu en premier ?",
    type: "single_choice",
    required: true,
    options: ["Veste Sika", "Robe Mina", "Ensemble Naya"],
    sortOrder: 1
  },
  {
    id: "q_price",
    testId: "test_rose",
    text: "Quel prix te semble juste ?",
    type: "price",
    required: true,
    options: [],
    min: 10000,
    max: 100000,
    sortOrder: 2
  },
  {
    id: "q_rating",
    testId: "test_rose",
    text: "Quelle note donnerais-tu a cette collection ?",
    type: "rating",
    required: true,
    options: [],
    min: 1,
    max: 5,
    sortOrder: 3
  },
  {
    id: "q_comment",
    testId: "test_rose",
    text: "Que changerais-tu avant production ?",
    type: "paragraph",
    required: false,
    options: [],
    sortOrder: 4
  }
];

export const responses: PublicResponse[] = [
  {
    id: "response_demo_1",
    testId: "test_rose",
    respondent: { firstName: "Amina", city: "Cotonou", country: "Benin", age: 27 },
    answers: {
      q_choice: "Veste Sika",
      q_price: 45000,
      q_rating: 5,
      q_comment: "La coupe est forte, je garderais la couleur rose mais plus douce."
    },
    startedAt: "2026-07-23T10:00:00.000Z",
    completedAt: "2026-07-23T10:02:00.000Z",
    createdAt: "2026-07-23T10:02:00.000Z"
  },
  {
    id: "response_demo_2",
    testId: "test_rose",
    respondent: { firstName: "Maeva", city: "Porto-Novo", country: "Benin", age: 31 },
    answers: {
      q_choice: "Robe Mina",
      q_price: 38000,
      q_rating: 4
    },
    startedAt: "2026-07-23T10:04:00.000Z",
    completedAt: "2026-07-23T10:05:20.000Z",
    createdAt: "2026-07-23T10:05:20.000Z"
  }
];
