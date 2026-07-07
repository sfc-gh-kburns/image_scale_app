"use client";

import { useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import ManualControls from "@/components/ManualControls";
import BannerControls from "@/components/BannerControls";
import ResultPreview from "@/components/ResultPreview";
import { Download, RotateCcw, Plus } from "lucide-react";
import { RETAILER_PRESETS } from "@/lib/presets";

type StepType = "walmart" | "target" | "banner" | "manual";

interface AppliedStep {
  type: StepType;
  label: string;
}

interface ResultItem {
  label: string;
  width: number;
  height: number;
  url: string;
  filename: string;
}

// Client-side image scaling via Canvas
function scaleImage(
  img: HTMLImageElement,
  targetW: number,
  targetH: number,
  fit: "contain" | "cover",
  bgColor: string | null,
  format: "jpeg" | "png"
): string {
  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d")!;

  // Fill background
  if (bgColor) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, targetW, targetH);
  }

  // Calculate fit dimensions
  const srcAspect = img.naturalWidth / img.naturalHeight;
  const dstAspect = targetW / targetH;
  let drawW: number, drawH: number, drawX: number, drawY: number;

  if (fit === "contain") {
    if (srcAspect > dstAspect) {
      drawW = targetW;
      drawH = targetW / srcAspect;
    } else {
      drawH = targetH;
      drawW = targetH * srcAspect;
    }
    drawX = (targetW - drawW) / 2;
    drawY = (targetH - drawH) / 2;
  } else {
    // cover
    if (srcAspect > dstAspect) {
      drawH = targetH;
      drawW = targetH * srcAspect;
    } else {
      drawW = targetW;
      drawH = targetW / srcAspect;
    }
    drawX = (targetW - drawW) / 2;
    drawY = (targetH - drawH) / 2;
  }

  ctx.drawImage(img, drawX, drawY, drawW, drawH);
  return canvas.toDataURL(format === "jpeg" ? "image/jpeg" : "image/png", 0.92);
}

// Client-side banner compositing
function compositeBanner(
  baseImg: HTMLImageElement,
  bannerImg: HTMLImageElement,
  position: "top" | "bottom" | "overlay",
  opacity: number
): { dataUrl: string; width: number; height: number } {
  const baseW = baseImg.naturalWidth;
  const baseH = baseImg.naturalHeight;

  // Scale banner to match base width
  const bannerScale = baseW / bannerImg.naturalWidth;
  const bannerH = Math.round(bannerImg.naturalHeight * bannerScale);

  let canvasW: number, canvasH: number;
  let baseY: number, bannerY: number;

  if (position === "overlay") {
    canvasW = baseW;
    canvasH = baseH;
    baseY = 0;
    bannerY = Math.round((baseH - bannerH) / 2);
  } else if (position === "top") {
    canvasW = baseW;
    canvasH = baseH + bannerH;
    baseY = bannerH;
    bannerY = 0;
  } else {
    canvasW = baseW;
    canvasH = baseH + bannerH;
    baseY = 0;
    bannerY = baseH;
  }

  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d")!;

  // White background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Draw base image
  ctx.drawImage(baseImg, 0, baseY, baseW, baseH);

  // Draw banner with opacity
  ctx.globalAlpha = opacity;
  ctx.drawImage(bannerImg, 0, bannerY, baseW, bannerH);
  ctx.globalAlpha = 1;

  return {
    dataUrl: canvas.toDataURL("image/png"),
    width: canvasW,
    height: canvasH,
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export default function Home() {
  const [workingPreview, setWorkingPreview] = useState<string | null>(null);
  const [workingDims, setWorkingDims] = useState<{ w: number; h: number } | null>(null);

  const [originalPreview, setOriginalPreview] = useState<string | null>(null);

  const [appliedSteps, setAppliedSteps] = useState<AppliedStep[]>([]);
  const [activeStep, setActiveStep] = useState<StepType | null>(null);
  const [processing, setProcessing] = useState(false);

  const [multiResults, setMultiResults] = useState<ResultItem[]>([]);

  function handleImage(_file: File, preview: string) {
    setWorkingPreview(preview);
    setOriginalPreview(preview);
    setAppliedSteps([]);
    setMultiResults([]);
    setActiveStep(null);
    const img = new window.Image();
    img.onload = () => setWorkingDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = preview;
  }

  function resetToOriginal() {
    if (originalPreview) {
      setWorkingPreview(originalPreview);
      setAppliedSteps([]);
      setMultiResults([]);
      setActiveStep(null);
      const img = new window.Image();
      img.onload = () => setWorkingDims({ w: img.naturalWidth, h: img.naturalHeight });
      img.src = originalPreview;
    }
  }

  function updateWorkingImage(dataUrl: string, step: AppliedStep, dims: { w: number; h: number }) {
    setWorkingPreview(dataUrl);
    setWorkingDims(dims);
    setAppliedSteps((prev) => [...prev, step]);
    setActiveStep(null);
  }

  async function processRetailer(retailer: "walmart" | "target") {
    if (!workingPreview) return;
    setProcessing(true);
    try {
      const img = await loadImage(workingPreview);
      const preset = RETAILER_PRESETS[retailer];
      const results: ResultItem[] = [];

      for (const size of preset.sizes) {
        const dataUrl = scaleImage(img, size.width, size.height, "contain", preset.background, preset.format);
        results.push({
          label: `${size.label} (${preset.name})`,
          width: size.width,
          height: size.height,
          url: dataUrl,
          filename: `${retailer}_${size.label.toLowerCase().replace(/\s+/g, "_")}_${size.width}x${size.height}.${preset.format === "jpeg" ? "jpg" : "png"}`,
        });
      }

      const mainResult = results[0];
      updateWorkingImage(mainResult.url, {
        type: retailer,
        label: `Scaled for ${retailer === "walmart" ? "Walmart" : "Target"}`,
      }, { w: mainResult.width, h: mainResult.height });
      setMultiResults(results);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      alert(`Processing failed: ${msg}`);
    }
    setProcessing(false);
  }

  async function processManual(width: number, height: number, fit: "contain" | "cover") {
    if (!workingPreview) return;
    setProcessing(true);
    try {
      const img = await loadImage(workingPreview);
      const dataUrl = scaleImage(img, width, height, fit, "#FFFFFF", "png");
      updateWorkingImage(dataUrl, {
        type: "manual",
        label: `Resized to ${width}×${height}`,
      }, { w: width, h: height });
      setMultiResults([]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      alert(`Processing failed: ${msg}`);
    }
    setProcessing(false);
  }

  async function processBanner(bannerFile: File, position: "top" | "bottom" | "overlay", opacity: number) {
    if (!workingPreview) return;
    setProcessing(true);
    try {
      const baseImg = await loadImage(workingPreview);
      const bannerUrl = URL.createObjectURL(bannerFile);
      const bannerImg = await loadImage(bannerUrl);
      URL.revokeObjectURL(bannerUrl);

      const result = compositeBanner(baseImg, bannerImg, position, opacity);
      updateWorkingImage(result.dataUrl, {
        type: "banner",
        label: `Banner added (${position})`,
      }, { w: result.width, h: result.height });
      setMultiResults([]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      alert(`Processing failed: ${msg}`);
    }
    setProcessing(false);
  }

  function downloadWorking() {
    if (!workingPreview) return;
    const a = document.createElement("a");
    a.href = workingPreview;
    a.download = `final_${workingDims?.w || 0}x${workingDims?.h || 0}.png`;
    a.click();
  }

  const hasSteps = appliedSteps.length > 0;

  return (
    <>
      {processing && (
        <div className="loading-overlay">
          <div className="spinner" />
        </div>
      )}

      {/* Step 1: Upload */}
      <p className="section-title">1. Upload your product image</p>
      {!workingPreview ? (
        <ImageUploader onImage={handleImage} />
      ) : (
        <div className="pipeline-workspace">
          {/* Working image preview */}
          <div className="working-preview">
            <div className="preview-box">
              <h4>
                {hasSteps ? "Current" : "Original"}
                {workingDims ? ` (${workingDims.w} × ${workingDims.h})` : ""}
              </h4>
              <img src={workingPreview} alt="Working" />
            </div>

            {hasSteps && (
              <div className="steps-history">
                {appliedSteps.map((s, i) => (
                  <span key={i} className="step-badge">{s.label}</span>
                ))}
              </div>
            )}

            <div className="working-actions">
              {hasSteps && (
                <>
                  <button className="btn btn-primary btn-small" onClick={downloadWorking}>
                    <Download size={14} /> Download Final
                  </button>
                  <button className="btn btn-secondary btn-small" onClick={resetToOriginal}>
                    <RotateCcw size={14} /> Start Over
                  </button>
                </>
              )}
              {!hasSteps && (
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => {
                    setWorkingPreview(null);
                    setWorkingDims(null);
                    setOriginalPreview(null);
                  }}
                >
                  Change Image
                </button>
              )}
            </div>
          </div>

          {/* Step 2: Choose operation */}
          <p className="section-title" style={{ marginTop: 32 }}>
            <Plus size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
            {hasSteps ? "Apply another operation" : "2. Choose an operation"}
          </p>

          <div className="op-grid">
            {([
              { id: "walmart" as StepType, label: "Scale for Walmart", desc: "2000, 1500, 500px sizes" },
              { id: "target" as StepType, label: "Scale for Target", desc: "1200, 800, 400px sizes" },
              { id: "banner" as StepType, label: "Add Banner", desc: "Overlay a banner image" },
              { id: "manual" as StepType, label: "Manual Scale", desc: "Custom dimensions" },
            ]).map((op) => (
              <button
                key={op.id}
                className={`op-card ${activeStep === op.id ? "active" : ""}`}
                onClick={() => setActiveStep(activeStep === op.id ? null : op.id)}
              >
                <span className="op-label">{op.label}</span>
                <span className="op-desc">{op.desc}</span>
              </button>
            ))}
          </div>

          {activeStep === "walmart" && (
            <div style={{ marginTop: 16 }}>
              <button
                className="btn btn-primary"
                onClick={() => processRetailer("walmart")}
                disabled={processing}
              >
                {processing ? "Processing..." : "Scale for Walmart"}
              </button>
            </div>
          )}

          {activeStep === "target" && (
            <div style={{ marginTop: 16 }}>
              <button
                className="btn btn-primary"
                onClick={() => processRetailer("target")}
                disabled={processing}
              >
                {processing ? "Processing..." : "Scale for Target"}
              </button>
            </div>
          )}

          {activeStep === "manual" && workingDims && (
            <ManualControls
              originalWidth={workingDims.w}
              originalHeight={workingDims.h}
              onProcess={processManual}
              processing={processing}
            />
          )}

          {activeStep === "banner" && (
            <BannerControls onProcess={processBanner} processing={processing} />
          )}

          {multiResults.length > 1 && (
            <ResultPreview results={multiResults} />
          )}
        </div>
      )}
    </>
  );
}
