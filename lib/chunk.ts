// lib/chunk.ts
import { PageText } from "./pdf";

export interface Chunk {
  content: string;
  pageNumber: number;
}

const CHUNK_SIZE = 800; // characters per chunk (rough proxy for tokens)
const CHUNK_OVERLAP = 150; // characters shared between consecutive chunks

export function chunkPages(pages: PageText[]): Chunk[] {
  const chunks: Chunk[] = [];

  for (const page of pages) {
    let start = 0;
    while (start < page.text.length) {
      const end = start + CHUNK_SIZE;
      const content = page.text.slice(start, end).trim();

      if (content.length > 0) {
        chunks.push({ content, pageNumber: page.pageNumber });
      }

      start += CHUNK_SIZE - CHUNK_OVERLAP; // step forward, but re-cover the overlap
    }
  }

  return chunks;
}
