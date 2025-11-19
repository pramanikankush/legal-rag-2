import { Type } from "@google/genai";

export enum ModelType {
  FLASH = 'gemini-2.0-flash-lite-preview-02-05',
  THINKING = 'gemini-2.0-flash-thinking-exp-1219' // Update thinking model too if possible, or keep as fallback
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'attorney' | 'paralegal' | 'admin';
  avatarUrl?: string;
}

export interface LegalDocument {
  id: string;
  title: string;
  content: string;
  type: 'CASE_LAW' | 'STATUTE' | 'CONTRACT' | 'MEMO';
  date: string;
  embedding?: number[];
}

export interface LegalResponse {
  executiveSummary: string;
  riskAssessment: {
    score: number; // 1-10
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    reasoning: string;
  };
  relevantStatutes: Array<{
    name: string;
    section: string;
    relevance: string;
  }>;
  caseLawPrecedents: Array<{
    caseName: string;
    citation: string;
    application: string;
  }>;
  recommendedActionPlan: string[];
}

export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string | LegalResponse;
  isStructured?: boolean;
  timestamp: number;
  sources?: SearchResult[];
}

// RAG Search Result
export interface SearchResult extends LegalDocument {
  similarity: number;
}

export interface ChatSession {
  id: string;
  title: string;
  date: string;
  preview: string;
  messages: ChatMessage[];
}

export const LegalResponseSchema = {
  type: Type.OBJECT,
  properties: {
    executiveSummary: {
      type: Type.STRING,
      description: "A concise professional summary of the legal situation.",
    },
    riskAssessment: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER, description: "Risk score from 1 to 10" },
        level: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
        reasoning: { type: Type.STRING, description: "Why this risk level was assigned." },
      },
      required: ["score", "level", "reasoning"],
    },
    relevantStatutes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          section: { type: Type.STRING },
          relevance: { type: Type.STRING },
        },
      },
    },
    caseLawPrecedents: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          caseName: { type: Type.STRING },
          citation: { type: Type.STRING },
          application: { type: Type.STRING, description: "How this case applies to the current situation." },
        },
      },
    },
    recommendedActionPlan: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Step-by-step legal strategy.",
    },
  },
  required: ["executiveSummary", "riskAssessment", "relevantStatutes", "caseLawPrecedents", "recommendedActionPlan"],
};