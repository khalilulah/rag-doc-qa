// components/EmptyState.tsx
"use client";

import { ShieldCheck, Quote, FileSearch } from "lucide-react";

const info = [
  {
    icon: FileSearch,
    title: "Grounded in your document",
    body: "Every answer is generated only from the content you uploaded — nothing outside it.",
  },
  {
    icon: Quote,
    title: "Cited, page by page",
    body: "Click a citation chip under any answer to see the exact excerpt it came from.",
  },
  {
    icon: ShieldCheck,
    title: "Honest when it doesn't know",
    body: "If the answer isn't in the document, I'll say so instead of guessing.",
  },
];

const examples = [
  "What is this document about?",
  "Summarize the key points",
  "Are there any dates or numbers mentioned?",
];

export default function EmptyState({
  onExample,
}: {
  onExample: (question: string) => void;
}) {
  return (
    <div style={{ paddingTop: 48, textAlign: "center" }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 32 }}>
        Ask about your document
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
          marginBottom: 40,
        }}
      >
        {info.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            style={{
              padding: 16,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow-rest)",
              textAlign: "left",
            }}
          >
            <Icon size={18} color="var(--accent)" style={{ marginBottom: 8 }} />
            <p style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 4 }}>
              {title}
            </p>
            <p
              style={{
                fontSize: 12.5,
                color: "var(--text-muted)",
                lineHeight: 1.5,
              }}
            >
              {body}
            </p>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          maxWidth: 420,
          margin: "0 auto",
        }}
      >
        {examples.map((q) => (
          <button
            key={q}
            onClick={() => onExample(q)}
            style={{
              padding: "10px 14px",
              textAlign: "left",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              fontSize: 13.5,
              cursor: "pointer",
              color: "var(--text)",
            }}
          >
            `{q}`
          </button>
        ))}
      </div>
    </div>
  );
}
