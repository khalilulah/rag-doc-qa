import { NextRequest } from "next/server";
import { embedText } from "@/lib/embed";
import { supabase } from "@/lib/supabase";
import Groq from "groq-sdk";

export const runtime = "nodejs";

interface MatchedChunk {
  id: string;
  content: string;
  page_number: number;
  similarity: number;
}

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: NextRequest) {
  const { documentId, question } = await request.json();

  if (!documentId || !question) {
    return new Response(
      JSON.stringify({ error: "documentId and question are required" }),
      {
        status: 400,
      },
    );
  }

  // Retrieval happens BEFORE we open the stream — it's fast, and we need
  // citations ready to send as the very first line.
  const queryEmbedding = await embedText(question);
  const { data: matches, error: matchError } = await supabase.rpc(
    "match_chunks",
    {
      query_embedding: queryEmbedding,
      match_count: 5,
      filter_document_id: documentId,
    },
  );

  if (matchError) {
    return new Response(JSON.stringify({ error: "Retrieval failed" }), {
      status: 500,
    });
  }

  const encoder = new TextEncoder();
  const citations = (matches ?? []).map((m: MatchedChunk) => ({
    page: m.page_number,
    excerpt: m.content.slice(0, 150),
    similarity: m.similarity,
  }));

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: object) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

      send({ type: "citations", citations });

      if (!matches || matches.length === 0) {
        send({
          type: "token",
          content:
            "I couldn't find anything relevant to that question in the document.",
        });
        send({ type: "done" });
        controller.close();
        return;
      }

      const context = matches
        .map(
          (m: MatchedChunk, i: number) =>
            `[Chunk ${i + 1}, Page ${m.page_number}]\n${m.content}`,
        )
        .join("\n\n");

      const prompt = `You are answering a question using only the context below. If the answer isn't in the context, say so — do not use outside knowledge.

        Style:
- Write in professional, precise, and authoritative language.
- use the STAR framework but Do NOT mention or explain any methodology, framework, or internal process

Depth & Explanation Requirements:
- Provide a detailed answer where the context allows.
- Do NOT summarize if additional explanation improves clarity.
- Explain relationships, changes, and implications explicitly when supported by the documents.

Context:
${context}

Question: ${question}

Answer clearly and directly. Do not mention chunks, page numbers, or sources in your answer — that information is tracked separately.`;

      //uncomment if answers still show page number and chunk
      // if (!answer) {
      //   return NextResponse.json({
      //     answer: "no answer was provided.",
      //     citations: [],
      //   });
      // }

      // const finalAnswer = answer.replace(/\(?page\s*\d+.*?\)?/gi, "");
      // 5. Return the answer plus the raw citations, so the frontend can show them

      try {
        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          stream: true,
        });

        for await (const chunk of completion) {
          const token = chunk.choices[0]?.delta?.content ?? "";
          if (token) send({ type: "token", content: token });
        }

        send({ type: "done" });
      } catch (err) {
        console.error("Groq streaming failed:", err);
        send({ type: "error", message: "Failed to generate an answer" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
