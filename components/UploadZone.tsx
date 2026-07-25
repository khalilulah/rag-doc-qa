// components/UploadZone.tsx
"use client";

import { useRef, useState } from "react";
import { FileText } from "lucide-react";

export default function UploadZone({
  onUpload,
  isUploading,
}: {
  onUpload: (file: File) => void;
  isUploading: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div style={{ flex: 1, display: "grid", placeItems: "center" }}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) onUpload(file);
        }}
        onClick={() => !isUploading && inputRef.current?.click()}
        style={{
          width: "min(360px, 90vw)",
          padding: "48px 32px",
          textAlign: "center",
          background: "var(--surface)",
          border: `1.5px dashed ${isDragging ? "var(--accent)" : "var(--border)"}`,
          borderRadius: "var(--radius-lg)",
          boxShadow: isDragging ? "var(--shadow-hover)" : "var(--shadow-rest)",
          cursor: isUploading ? "default" : "pointer",
          transition: "box-shadow 0.15s ease, border-color 0.15s ease",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
          }}
        />

        {isUploading ? (
          <>
            <p
              style={{
                color: "var(--text-muted)",
                marginBottom: 14,
                fontSize: 14,
              }}
            >
              Reading your document…
            </p>
            <div className="progress-track">
              <div className="progress-bar" />
            </div>
          </>
        ) : (
          <>
            <div
              className="float-icon"
              style={{ marginBottom: 16, color: "var(--accent)" }}
            >
              <FileText size={40} strokeWidth={1.5} />
            </div>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>Drop a PDF here</p>
            <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
              or click to browse
            </p>
          </>
        )}
      </div>
    </div>
  );
}
