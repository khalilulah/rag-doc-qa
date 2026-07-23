// lib/embed.ts
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function embedText(text: string): Promise<number[]> {
  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
  });

  const values = response.embeddings?.[0]?.values;
  if (!values) {
    throw new Error("Gemini returned no embedding for the given text");
  }

  return values;
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: texts,
  });

  if (!response.embeddings || response.embeddings.length === 0) {
    throw new Error("Gemini returned no embeddings for the given text");
  }

  return response.embeddings.map((e, i) => {
    if (!e.values) {
      throw new Error(
        `Gemini returned no embedding for batch item at index ${i}`,
      );
    }
    return e.values;
  });
}
