// app/api/query/route.ts
import { NextRequest, NextResponse } from "next/server";
import { embedText } from "@/lib/embed";
import { supabase } from "@/lib/supabase";
import Groq from "groq-sdk";

interface MatchedChunk {
  id: string;
  content: string;
  page_number: number;
  similarity: number;
}

export const runtime = "nodejs";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: NextRequest) {
  const { documentId, question } = await request.json();

  if (!documentId || !question) {
    return NextResponse.json(
      { error: "documentId and question are required" },
      { status: 400 },
    );
  }

  try {
    // 1. Embed the user's question
    const queryEmbedding = await embedText(question);

    // 2. Find the most similar chunks for this specific document
    const { data: matches, error: matchError } = await supabase.rpc(
      "match_chunks",
      {
        query_embedding: queryEmbedding,
        match_count: 5,
        filter_document_id: documentId,
      },
    );

    if (matchError) throw matchError;

    if (!matches || matches.length === 0) {
      return NextResponse.json({
        answer:
          "I couldn't find anything relevant to that question in the document.",
        citations: [],
      });
    }

    // 3. Build the prompt: give the model ONLY the retrieved chunks as context
    const context = matches
      .map(
        (m: MatchedChunk, i: number) =>
          `[Chunk ${i + 1}, Page ${m.page_number}]\n${m.content}`,
      )
      .join("\n\n");

    const prompt = `You are answering a question using only the context below. If the answer isn't in the context, say so — do not use outside knowledge.

Context:
${context}

Question: ${question}

Answer clearly and directly. Do not mention chunks, page numbers, or sources in your answer — that information is tracked separately.`;

    // 4. Generate the answer with Groq
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
    });

    const answer = completion.choices[0].message.content;

    //uncomment if answers still show page number and chunk
    // if (!answer) {
    //   return NextResponse.json({
    //     answer: "no answer was provided.",
    //     citations: [],
    //   });
    // }

    // const finalAnswer = answer.replace(/\(?page\s*\d+.*?\)?/gi, "");
    // 5. Return the answer plus the raw citations, so the frontend can show them
    return NextResponse.json({
      answer,
      citations: matches.map((m: MatchedChunk) => ({
        page: m.page_number,
        excerpt: m.content.slice(0, 150),
        similarity: m.similarity,
      })),
    });
  } catch (err) {
    console.error("Query failed:", err);
    return NextResponse.json(
      { error: "Failed to answer question" },
      { status: 500 },
    );
  }
}
