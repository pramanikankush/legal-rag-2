import { LegalDocument, SearchResult } from "../types";
import { generateEmbedding } from "./geminiService";

// Chunking Configuration
const CHUNK_SIZE = 1000; // Characters per chunk
const CHUNK_OVERLAP = 200; // Overlap to maintain context

interface DocumentChunk extends LegalDocument {
  docId: string; // Reference to parent document
  chunkIndex: number;
}

// Helper: Chunk Text
const chunkText = (text: string, size: number, overlap: number): string[] => {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push(text.slice(start, end));

    if (end === text.length) break;
    start += size - overlap;
  }

  return chunks;
};

// Simple in-memory vector store
class VectorStore {
  private chunks: DocumentChunk[] = [];
  private documents: Map<string, LegalDocument> = new Map();

  constructor() {
    // Empty initially - no mocks
  }

  // Ingest a document: Chunk -> Embed -> Store
  async ingest(doc: LegalDocument): Promise<{ chunksInserted: number }> {
    // 1. Store raw document metadata
    this.documents.set(doc.id, doc);

    // 2. Chunk text
    const textChunks = chunkText(doc.content, CHUNK_SIZE, CHUNK_OVERLAP);
    console.log(`Chunking "${doc.title}" into ${textChunks.length} chunks...`);

    // 3. Generate Embeddings for each chunk
    // Note: In production, do this in batches to avoid rate limits
    const newChunks: DocumentChunk[] = [];

    for (let i = 0; i < textChunks.length; i++) {
      const chunkContent = textChunks[i];
      try {
        // Add a small delay to avoid hitting rate limits too hard in loop
        await new Promise(resolve => setTimeout(resolve, 200));

        const embedding = await generateEmbedding(chunkContent);

        newChunks.push({
          id: `${doc.id}-chunk-${i}`,
          docId: doc.id,
          title: `${doc.title} (Part ${i + 1})`,
          type: doc.type,
          date: doc.date,
          content: chunkContent,
          chunkIndex: i,
          embedding: embedding
        });
      } catch (error) {
        console.error(`Failed to embed chunk ${i} of ${doc.title}`, error);
        // Continue with other chunks even if one fails
      }
    }

    // 4. Store chunks
    this.chunks.push(...newChunks);
    console.log(`Ingested ${newChunks.length} chunks for ${doc.title}`);

    return { chunksInserted: newChunks.length };
  }

  // Initialize - No-op now as we don't load mocks
  async init() {
    return;
  }

  // Cosine Similarity
  private cosineSimilarity(vecA: number[], vecB: number[]) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }

  async retrieve(query: string, k: number = 5): Promise<SearchResult[]> {
    if (this.chunks.length === 0) return [];

    console.log(`Retrieving context for: "${query}"`);
    const queryEmbedding = await generateEmbedding(query);

    const scoredChunks = this.chunks.map(chunk => {
      if (!chunk.embedding) return { ...chunk, similarity: 0 };
      return {
        ...chunk,
        similarity: this.cosineSimilarity(queryEmbedding, chunk.embedding)
      };
    });

    // Filter and Sort
    const results = scoredChunks
      .filter(chunk => chunk.similarity > 0.3) // Minimum relevance threshold
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k);

    console.log(`Found ${results.length} relevant chunks.`);
    return results;
  }

  getAllDocs(): LegalDocument[] {
    return Array.from(this.documents.values());
  }

  async getDocuments(): Promise<LegalDocument[]> {
    return Array.from(this.documents.values());
  }
}

export const vectorStore = new VectorStore();