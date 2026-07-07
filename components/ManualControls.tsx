"use client";

import { useState } from "react";

interface ManualControlsProps {
  originalWidth: number;
  originalHeight: number;
  onProcess: (width: number, height: number, fit: "contain" | "cover") => void;
  processing: boolean;
}

export default function ManualControls({ originalWidth, originalHeight, onProcess, processing }: ManualControlsProps) {
  const [width, setWidth] = useState(originalWidth);
  const [height, setHeight] = useState(originalHeight);
  const [lockAspect, setLockAspect] = useState(true);
  const [fit, setFit] = useState<"contain" | "cover">("contain");

  const aspect = originalWidth / originalHeight;

  function handleWidth(val: number) {
    setWidth(val);
    if (lockAspect) setHeight(Math.round(val / aspect));
  }

  function handleHeight(val: number) {
    setHeight(val);
    if (lockAspect) setWidth(Math.round(val * aspect));
  }

  return (
    <div className="controls-section">
      <h3>Manual Dimensions</h3>
      <div className="form-row">
        <div className="form-group">
          <label>Width (px)</label>
          <input
            type="number"
            value={width}
            onChange={(e) => handleWidth(Number(e.target.value))}
            min={1}
            max={10000}
          />
        </div>
        <div className="form-group">
          <label>Height (px)</label>
          <input
            type="number"
            value={height}
            onChange={(e) => handleHeight(Number(e.target.value))}
            min={1}
            max={10000}
          />
        </div>
        <div className="form-group">
          <label>Fit Mode</label>
          <select value={fit} onChange={(e) => setFit(e.target.value as "contain" | "cover")}>
            <option value="contain">Contain (letterbox)</option>
            <option value="cover">Cover (crop)</option>
          </select>
        </div>
      </div>
      <div className="form-row" style={{ marginTop: 12 }}>
        <div className="toggle-row">
          <div className={`toggle ${lockAspect ? "on" : ""}`} onClick={() => setLockAspect(!lockAspect)} />
          <span className="toggle-label">Lock aspect ratio</span>
        </div>
      </div>
      <div style={{ marginTop: 20 }}>
        <button
          className="btn btn-primary"
          onClick={() => onProcess(width, height, fit)}
          disabled={processing || width < 1 || height < 1}
        >
          {processing ? "Processing..." : "Scale Image"}
        </button>
      </div>
    </div>
  );
}
