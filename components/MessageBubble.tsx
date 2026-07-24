// components/MessageBubble.tsx
import type { Message } from "@/app/page";
import CitationChips from "./CitationChips";

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 16,
      }}
    >
      <div style={{ maxWidth: "75%" }}>
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-lg)",
            background: isUser ? "var(--accent)" : "var(--surface)",
            color: isUser ? "white" : "var(--text)",
            boxShadow: isUser ? "none" : "var(--shadow-rest)",
            border: isUser ? "none" : "1px solid var(--border)",
            whiteSpace: "pre-wrap",
            fontSize: 14.5,
            lineHeight: 1.55,
          }}
        >
          {message.content}
        </div>
        {message.citations && message.citations.length > 0 && (
          <CitationChips citations={message.citations} />
        )}
      </div>
    </div>
  );
}
