// lib/pdf.ts
import { PDFParse } from "pdf-parse";

export interface PageText {
  pageNumber: number;
  text: string;
}

export async function extractPages(buffer: Buffer): Promise<PageText[]> {
  const parser = new PDFParse({ data: buffer });

  try {
    const info = await parser.getInfo({ parsePageInfo: true });
    const pages: PageText[] = [];

    for (let i = 1; i <= info.total; i++) {
      const result = await parser.getText({ partial: [i] });
      pages.push({ pageNumber: i, text: result.text });
    }

    return pages;
  } finally {
    await parser.destroy(); // always release, even if something threw
  }
}
