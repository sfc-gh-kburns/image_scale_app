"use client";

import { useState } from "react";
import ImageUploader from "./ImageUploader";

interface BannerControlsProps {
  onProcess: (bannerFile: File, position: "top" | "bottom" | "overlay", opacity: number) => void;
  processing: boolean;
}

interface DefaultBanner {
  text: string;
  bgColor: string;
  textColor: string;
}

const DEFAULT_BANNERS: DefaultBanner[] = [
  { text: "Exclusively at Walmart!", bgColor: "#0071DC", textColor: "#FFFFFF" },
  { text: "Exclusively at Target", bgColor: "#CC0000", textColor: "#FFFFFF" },
  { text: "Only at Target", bgColor: "#CC0000", textColor: "#FFFFFF" },
  { text: "NEW! Limited Edition", bgColor: "#DF0714", textColor: "#FFFFFF" },
  { text: "Buy 2, Get 1 Free", bgColor: "#1A1A1A", textColor: "#FFD700" },
  { text: "As Seen on TikTok", bgColor: "#000000", textColor: "#FFFFFF" },
  { text: "Award Winning Formula", bgColor: "#2D2D2D", textColor: "#F5C518" },
  { text: "Vegan & Cruelty Free", bgColor: "#2E7D32", textColor: "#FFFFFF" },
];

export default function BannerControls({ onProcess, processing }: BannerControlsProps) {
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [position, setPosition] = useState<"top" | "bottom" | "overlay">("top");
  const [opacity, setOpacity] = useState(100);
  const [generatingBanner, setGeneratingBanner] = useState(false);

  async function selectDefaultBanner(banner: DefaultBanner) {
    setGeneratingBanner(true);
    try {
      // Generate banner client-side with Canvas
      const width = 800;
      const height = 120;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;

      ctx.fillStyle = banner.bgColor;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = banner.textColor;
      ctx.font = "bold 42px Arial, Helvetica, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(banner.text, width / 2, height / 2);

      // Convert canvas to blob without fetch (avoids CSP/proxy issues)
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error("Canvas toBlob failed"));
        }, "image/png");
      });

      const dataUrl = canvas.toDataURL("image/png");
      const file = new File([blob], `banner_${banner.text.toLowerCase().replace(/\s+/g, "_")}.png`, { type: "image/png" });

      setBannerFile(file);
      setBannerPreview(dataUrl);
    } catch (err) {
      console.error(err);
      alert("Failed to generate banner");
    }
    setGeneratingBanner(false);
  }

  return (
    <div className="controls-section">
      <h3>Banner Image</h3>

      {!bannerPreview ? (
        <>
          <p className="section-title" style={{ marginTop: 8 }}>Default Banners</p>
          <div className="default-banners-grid">
            {DEFAULT_BANNERS.map((b, i) => (
              <button
                key={i}
                className="default-banner-btn"
                style={{ background: b.bgColor, color: b.textColor }}
                onClick={() => selectDefaultBanner(b)}
                disabled={generatingBanner}
              >
                {b.text}
              </button>
            ))}
          </div>

          <div style={{ margin: "20px 0 8px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: "var(--gray-300)" }} />
            <span style={{ fontSize: 12, color: "var(--gray-500)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
              Or upload your own
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--gray-300)" }} />
          </div>

          <ImageUploader
            label="Drop your banner image here"
            onImage={(file, preview) => {
              setBannerFile(file);
              setBannerPreview(preview);
            }}
          />
        </>
      ) : (
        <div style={{ marginBottom: 16 }}>
          <div className="preview-box" style={{ display: "inline-block" }}>
            <h4>Banner Preview</h4>
            <img src={bannerPreview} alt="Banner" style={{ maxHeight: 100 }} />
          </div>
          <button
            className="btn btn-secondary btn-small"
            style={{ marginLeft: 12 }}
            onClick={() => { setBannerFile(null); setBannerPreview(null); }}
          >
            Change
          </button>
        </div>
      )}

      <div className="form-row" style={{ marginTop: 16 }}>
        <div className="form-group">
          <label>Position</label>
          <div className="position-selector">
            {(["top", "bottom", "overlay"] as const).map((p) => (
              <button
                key={p}
                className={`position-btn ${position === p ? "active" : ""}`}
                onClick={() => setPosition(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Opacity ({opacity}%)</label>
          <input
            type="range"
            min={10}
            max={100}
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            style={{ width: 120 }}
          />
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <button
          className="btn btn-primary"
          onClick={() => bannerFile && onProcess(bannerFile, position, opacity / 100)}
          disabled={processing || !bannerFile}
        >
          {processing ? "Processing..." : "Apply Banner"}
        </button>
      </div>
    </div>
  );
}
