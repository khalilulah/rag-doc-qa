// app/page.tsx
"use client";

import { useState } from "react";
import UploadZone from "@/components/UploadZone";
import ChatWindow from "@/components/ChatWindow";

export type Citation = { page: number; excerpt: string; similarity: number };
export type Message = {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
};

type AppState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "ready"; documentId: string; filename: string };

export default function Home() {
  const [state, setState] = useState<AppState>({ status: "idle" });
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(file: File) {
    setError(null);
    setState({ status: "uploading" });
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      setState({
        status: "ready",
        documentId: data.documentId,
        filename: file.name,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setState({ status: "idle" });
    }
  }

  // app/page.tsx — handleAsk replaced
  async function handleAsk(question: string) {
    if (state.status !== "ready") return;

    setError(null);
    // push the user's question, plus an empty assistant message we'll fill in as tokens arrive
    setMessages((prev) => [
      ...prev,
      { role: "user", content: question },
      { role: "assistant", content: "" },
    ]);
    setIsAsking(true);

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: state.documentId, question }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Something went wrong");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? ""; // last entry may be a half-received line — hold it for the next chunk

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line);

          if (event.type === "citations") {
            setMessages((prev) => {
              const next = [...prev];
              next[next.length - 1] = {
                ...next[next.length - 1],
                citations: event.citations,
              };
              return next;
            });
          } else if (event.type === "token") {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              next[next.length - 1] = {
                ...last,
                content: last.content + event.content,
              };
              return next;
            });
          } else if (event.type === "error") {
            throw new Error(event.message);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get an answer");
      setMessages((prev) => prev.slice(0, -2)); // remove both the question and the empty placeholder
    } finally {
      setIsAsking(false);
    }
  }

  return (
    <main style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <strong>DocQA</strong>
        {state.status === "ready" && (
          <span
            className="mono"
            style={{ fontSize: 13, color: "var(--text-muted)" }}
          >
            {state.filename}
          </span>
        )}
      </header>

      {error && (
        <div
          role="alert"
          style={{
            margin: "12px 24px 0",
            padding: "10px 14px",
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            color: "#B91C1C",
            borderRadius: "var(--radius-sm)",
            fontSize: 13.5,
          }}
        >
          {error}
        </div>
      )}

      {state.status === "ready" ? (
        <ChatWindow messages={messages} onAsk={handleAsk} isAsking={isAsking} />
      ) : (
        <UploadZone
          onUpload={handleUpload}
          isUploading={state.status === "uploading"}
        />
      )}
    </main>
  );
}
