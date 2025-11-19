import { GoogleGenAI, Type } from "@google/genai";
import { LegalResponse, LegalResponseSchema, ModelType } from "../types";

// In a real backend (Genkit), this would be process.env.API_KEY handled server-side.
// For this React demo, we assume the environment variable is available to the build.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

const ai = new GoogleGenAI({ apiKey: API_KEY });

// Helper for exponential backoff
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    // Check for 429 (Too Many Requests) or 503 (Service Unavailable)
    // The error object structure might vary, so we check message or status if available
    const isRetryable =
      error?.status === 429 ||
      error?.status === 503 ||
      error?.message?.includes('429') ||
      error?.message?.includes('503') ||
      error?.message?.includes('quota');

    if (retries > 0 && isRetryable) {
      console.warn(`API Error: ${error.message}. Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(operation, retries - 1, delay * 2);
    }
    throw error;
  }
}

export const generateEmbedding = async (text: string): Promise<number[]> => {
  if (!API_KEY) throw new Error("API Key missing");

  try {
    return await retryWithBackoff(async () => {
      const response = await ai.models.embedContent({
        model: "text-embedding-004",
        contents: text,
      });

      if (!response.embeddings?.[0]?.values) {
        throw new Error("Failed to generate embedding");
      }

      return response.embeddings[0].values;
    });
  } catch (error) {
    console.error("Embedding error:", error);
    throw error;
  }
};



export const generateLegalAnalysis = async (
  query: string,
  context: string,
  model: ModelType
): Promise<LegalResponse> => {
  if (!API_KEY) throw new Error("API Key missing");

  // Construct the RAG prompt
  const prompt = `
    You are LexAI, an expert senior legal counsel. 
    Analyze the following user query strictly based on the provided LEGAL CONTEXT.
    
    If the context does not contain the answer, use your general legal knowledge but strictly explicitly state that you are doing so in the summary.
    
    LEGAL CONTEXT:
    ${context}
    
    USER QUERY:
    ${query}
    
    Provide a structured JSON response containing a risk assessment, relevant statutes from the context, applicable case law from the context, and a strategic action plan.
  `;

  // Configure model based on selection
  // Thinking models (2.5) handle complex reasoning better
  const isThinking = model === ModelType.THINKING;

  try {
    const response = await retryWithBackoff(() => ai.models.generateContent({
      model: isThinking ? ModelType.THINKING : model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: LegalResponseSchema,
        systemInstruction: "You are a helpful and precise legal AI assistant.",
        // thinkingConfig: isThinking ? { thinkingBudget: 2048 } : undefined, // Only enabled if using a supportive model
      },
    }));

    const text = response.text;
    if (!text) throw new Error("No response from model");

    try {
      const data = JSON.parse(text) as LegalResponse;
      return data;
    } catch (e) {
      console.error("JSON Parse error", text);
      throw new Error("Failed to parse legal response structure: " + (e as Error).message);
    }
  } catch (error) {
    console.error("Analysis generation error:", error);
    // Log the API key status (safe)
    console.log("API Key present:", !!API_KEY);
    console.log("Key suffix:", API_KEY.slice(-4));
    throw error;
  }
};