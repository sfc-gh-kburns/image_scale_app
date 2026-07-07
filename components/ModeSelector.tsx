"use client";

import { ShoppingCart, Target, Image, Maximize } from "lucide-react";

export type ScaleMode = "walmart" | "target" | "banner" | "manual";

interface ModeSelectorProps {
  selected: ScaleMode | null;
  onSelect: (mode: ScaleMode) => void;
}

const modes: { id: ScaleMode; icon: React.ReactNode; title: string; desc: string }[] = [
  { id: "walmart", icon: <ShoppingCart size={28} />, title: "Scale for Walmart", desc: "2000×2000, 1500×1500, 500×500" },
  { id: "target", icon: <Target size={28} />, title: "Scale for Target", desc: "1200×1200, 800×800, 400×400" },
  { id: "banner", icon: <Image size={28} />, title: "Add Banner", desc: "Overlay a banner on your image" },
  { id: "manual", icon: <Maximize size={28} />, title: "Manual Scale", desc: "Choose custom dimensions" },
];

export default function ModeSelector({ selected, onSelect }: ModeSelectorProps) {
  return (
    <div className="mode-grid">
      {modes.map((m) => (
        <div
          key={m.id}
          className={`mode-card ${selected === m.id ? "active" : ""}`}
          onClick={() => onSelect(m.id)}
        >
          <div className="icon">{m.icon}</div>
          <h3>{m.title}</h3>
          <p>{m.desc}</p>
        </div>
      ))}
    </div>
  );
}
