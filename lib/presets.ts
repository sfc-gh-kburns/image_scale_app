export interface ImageSize {
  label: string;
  width: number;
  height: number;
}

export interface RetailerPreset {
  name: string;
  description: string;
  sizes: ImageSize[];
  format: "jpeg" | "png";
  background: string | null; // null = transparent, hex = fill color
}

export const RETAILER_PRESETS: Record<string, RetailerPreset> = {
  walmart: {
    name: "Walmart",
    description: "Walmart Marketplace product image specifications",
    sizes: [
      { label: "Main Image", width: 2000, height: 2000 },
      { label: "Secondary", width: 1500, height: 1500 },
      { label: "Swatch", width: 500, height: 500 },
    ],
    format: "jpeg",
    background: "#FFFFFF",
  },
  target: {
    name: "Target",
    description: "Target Plus product image specifications",
    sizes: [
      { label: "Main Image", width: 1200, height: 1200 },
      { label: "Alternate", width: 800, height: 800 },
      { label: "Swatch", width: 400, height: 400 },
    ],
    format: "png",
    background: null,
  },
};
