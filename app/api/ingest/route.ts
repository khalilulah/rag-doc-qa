// app/api/ingest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { extractPages } from "@/lib/pdf";
import { chunkPages } from "@/lib/chunk";
import { embedBatch } from "@/lib/embed";
import { supabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  // 1. Get or create a session ID for this visitor
  let sessionId = request.cookies.get("session_id")?.value;
  const isNewSession = !sessionId;
  if (!sessionId) {
    sessionId = randomUUID();
  }

  // 2. Get the uploaded file out of the form data
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  try {
    // 3. Convert the browser File into a Node Buffer, and extract text per page
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pages = await extractPages(buffer);

    // 4. Split into overlapping chunks, each tagged with its page number
    const chunks = chunkPages(pages);

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "No extractable text found in this PDF" },
        { status: 400 },
      );
    }

    // 5. Embed all chunks in one batched call
    const embeddings = await embedBatch(chunks.map((c) => c.content));

    // 6. Create the document row
    const { data: document, error: docError } = await supabase
      .from("documents")
      .insert({ filename: file.name, session_id: sessionId })
      .select()
      .single();

    if (docError) throw docError;

    // 7. Insert all chunks, each paired with its embedding
    const rows = chunks.map((chunk, i) => ({
      document_id: document.id,
      content: chunk.content,
      page_number: chunk.pageNumber,
      embedding: embeddings[i],
    }));

    const { error: chunksError } = await supabase.from("chunks").insert(rows);
    if (chunksError) throw chunksError;

    // 8. Respond, setting the session cookie if this was a new visitor
    const response = NextResponse.json({
      documentId: document.id,
      chunkCount: chunks.length,
    });
    if (isNewSession) {
      response.cookies.set("session_id", sessionId, {
        httpOnly: true,
        maxAge: 60 * 60 * 2, // 2 hours, matching our TTL
        sameSite: "lax",
      });
    }
    return response;
  } catch (err) {
    console.error("Ingestion failed:", err);
    return NextResponse.json(
      { error: "Failed to process document" },
      { status: 500 },
    );
  }
}
