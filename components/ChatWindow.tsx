// components/ChatWindow.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import type { Message } from "@/app/page";
import MessageBubble from "./MessageBubble";
// components/ChatWindow.tsx — top of file
import { Send } from "lucide-react";
import EmptyState from "./EmptyState";

export default function ChatWindow({
  messages,
  onAsk,
  isAsking,
}: {
  messages: Message[];
  onAsk: (question: string) => void;
  isAsking: boolean;
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAsking]);

  function submit() {
    if (!input.trim() || isAsking) return;
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
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px 8px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          {messages.length === 0 ? (
            <EmptyState onExample={onAsk} />
          ) : (
            messages.map((m, i) => (
              <MessageBubble
                key={i}
                message={m}
                isStreaming={
                  isAsking &&
                  i === messages.length - 1 &&
                  m.role === "assistant"
                }
              />
            ))
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <div
        className="chat-input-row"
        style={{
          display: "flex",
          justifyContent: "center",
          padding: 16,
          borderTop: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", gap: 8, width: "100%", maxWidth: 720 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Ask a question…"
            disabled={isAsking}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              fontFamily: "inherit",
              fontSize: 16, // 16px, not 14 — prevents iOS Safari auto-zooming into the input on focus
            }}
          />

          <button
            onClick={submit}
            disabled={isAsking}
            style={{
              padding: "10px 16px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: "var(--accent)",
              color: "white",
              display: "grid",
              placeItems: "center",
              cursor: isAsking ? "default" : "pointer",
              opacity: isAsking ? 0.6 : 1,
            }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
