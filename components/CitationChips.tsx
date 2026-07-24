// components/CitationChips.tsx
"use client";

import { useState } from "react";
import type { Citation } from "@/app/page";

export default function CitationChips({
  citations,
}: {
  citations: Citation[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // dedupe by page number — multiple chunks can share a page, but we only need one chip per page
  const pages = Array.from(new Map(citations.map((c) => [c.page, c])).values());

  return (
    <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
      {pages.map((c, i) => (
        <div key={c.page} style={{ position: "relative" }}>
          <button
            className="mono"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            style={{
              fontSize: 12,
              padding: "4px 10px",
              borderRadius: "var(--radius-sm)",
              background: "var(--evidence-soft)",
              color: "var(--evidence)",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            p.{c.page}
          </button>
          {openIndex === i && (
            <div
              className="mono"
              style={{
                position: "absolute",
                bottom: "120%",
                left: 0,
                width: 240,
                padding: 10,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                boxShadow: "var(--shadow-hover)",
                fontSize: 12,
                color: "var(--text-muted)",
                zIndex: 10,
              }}
            >
              `{c.excerpt}…`
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
