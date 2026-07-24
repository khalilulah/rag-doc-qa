// components/ChatWindow.tsx
"use client";

import { useState } from "react";
import type { Message } from "@/app/page";
import MessageBubble from "./MessageBubble";

export default function ChatWindow({
  messages,
  onAsk,
}: {
  messages: Message[];
  onAsk: (question: string) => void;
}) {
  const [input, setInput] = useState("");

  function submit() {
    if (!input.trim()) return;
    onAsk(input);
    setInput("");
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
        {messages.length === 0 && (
          <p style={{ color: "var(--text-muted)" }}>
            Ask anything about your document.
          </p>
        )}
        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} />
        ))}
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          padding: 16,
          borderTop: "1px solid var(--border)",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Ask a question…"
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            fontFamily: "inherit",
            fontSize: 14,
          }}
        />
        <button
          onClick={submit}
          style={{
            padding: "10px 18px",
            borderRadius: "var(--radius-sm)",
            border: "none",
            background: "var(--accent)",
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
