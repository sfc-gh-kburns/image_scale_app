"use client";

import { Download } from "lucide-react";

interface ResultItem {
  label: string;
  width: number;
  height: number;
  url: string;
  filename: string;
}

interface ResultPreviewProps {
  results: ResultItem[];
}

export default function ResultPreview({ results }: ResultPreviewProps) {
  function downloadAll() {
    results.forEach((r) => {
      const a = document.createElement("a");
      a.href = r.url;
      a.download = r.filename;
      a.click();
    });
  }

  if (results.length === 0) return null;

  return (
    <div>
      <div className="actions-bar">
        <p className="section-title">Results ({results.length} images)</p>
        <button className="btn btn-secondary btn-small" onClick={downloadAll}>
          <Download size={14} /> Download All
        </button>
      </div>
      <div className="results-grid">
        {results.map((r, i) => (
          <div key={i} className="result-card">
            <img src={r.url} alt={r.label} />
            <div className="label">{r.label}</div>
            <div className="dims">{r.width} × {r.height}</div>
            <a href={r.url} download={r.filename} className="btn btn-primary btn-small" style={{ marginTop: 10, textDecoration: "none" }}>
              <Download size={12} /> Save
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
