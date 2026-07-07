"use client";

import { useRef, useState, DragEvent } from "react";
import { Upload } from "lucide-react";

interface ImageUploaderProps {
  label?: string;
  onImage: (file: File, preview: string) => void;
}

export default function ImageUploader({ label, onImage }: ImageUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    onImage(file, url);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div
      className={`upload-zone ${dragOver ? "drag-over" : ""}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <Upload size={40} className="icon" />
      <h3>{label || "Drop your image here"}</h3>
      <p>or click to browse — PNG, JPG, WebP supported</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onChange}
        style={{ display: "none" }}
      />
    </div>
  );
}
