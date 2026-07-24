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

  async function handleUpload(file: File) {
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
      alert(err instanceof Error ? err.message : "Upload failed");
      setState({ status: "idle" });
    }
  }

  async function handleAsk(question: string) {
    if (state.status !== "ready") return;

    setMessages((prev) => [...prev, { role: "user", content: question }]);

    const res = await fetch("/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: state.documentId, question }),
    });
    const data = await res.json();

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: data.answer, citations: data.citations },
    ]);
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

      {state.status === "ready" ? (
        <ChatWindow messages={messages} onAsk={handleAsk} />
      ) : (
        <UploadZone
          onUpload={handleUpload}
          isUploading={state.status === "uploading"}
        />
      )}
    </main>
  );
}
