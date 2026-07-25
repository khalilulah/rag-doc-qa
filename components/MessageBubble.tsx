// components/MessageBubble.tsx
import type { Message } from "@/app/page";
import CitationChips from "./CitationChips";

export default function MessageBubble({
  message,
  isStreaming,
}: {
  message: Message;
  isStreaming?: boolean;
}) {
  const isUser = message.role === "user";
  const isEmpty = message.content.length === 0;

  return (
    <div
      className="message-in"
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 16,
      }}
    >
      <div style={{}}>
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-lg)",
            background: isUser ? "var(--accent)" : "",
            color: isUser ? "white" : "var(--text)",
            boxShadow: isUser ? "none" : "",
            border: isUser ? "none" : "",
            whiteSpace: "pre-wrap",
            fontSize: 14.5,
            lineHeight: 1.55,
            minHeight: isEmpty && isStreaming ? 20 : undefined,
          }}
        >
          {isEmpty && isStreaming ? (
            <span style={{ display: "flex", gap: 4 }}>
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </span>
          ) : (
            <>
              {message.content}
              {isStreaming && <span className="stream-cursor" />}
            </>
          )}
        </div>
        {message.citations && message.citations.length > 0 && (
          <CitationChips citations={message.citations} />
        )}
      </div>
    </div>
  );
}
