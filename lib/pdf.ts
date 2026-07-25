// lib/pdf.ts
import { getDocumentProxy, extractText } from "unpdf";

export interface PageText {
  pageNumber: number;
  text: string;
}

export async function extractPages(buffer: Buffer): Promise<PageText[]> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));

  try {
    const { text } = await extractText(pdf, { mergePages: false });
    // mergePages: false → `text` is an array of strings, one per page
    return text.map((pageText, i) => ({ pageNumber: i + 1, text: pageText }));
  } finally {
    await pdf.destroy(); // same cleanup reasoning as before — always release, even on failure
  }
}
