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

  async function handleAsk(question: string) {
    if (state.status !== "ready") return;

    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setIsAsking(true);

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: state.documentId, question }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Something went wrong");

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer, citations: data.citations },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get an answer");
      // roll back the user's message so it doesn't look like it was answered
      setMessages((prev) => prev.slice(0, -1));
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
