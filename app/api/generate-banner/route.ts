import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(req: NextRequest) {
  try {
    const { text, bgColor, textColor, width, height } = await req.json();

    const w = width || 800;
    const h = height || 120;
    const bg = bgColor || "#DF0714";
    const fg = textColor || "#FFFFFF";
    const fontSize = Math.min(48, Math.round(h * 0.4));

    const svg = `
      <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${bg}"/>
        <text
          x="50%" y="55%"
          text-anchor="middle"
          dominant-baseline="middle"
          font-family="Arial, Helvetica, sans-serif"
          font-weight="800"
          font-size="${fontSize}"
          fill="${fg}"
          letter-spacing="1"
        >${escapeXml(text)}</text>
      </svg>
    `;

    const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
    const base64 = buffer.toString("base64");

    return NextResponse.json({
      url: `data:image/png;base64,${base64}`,
    });
  } catch (err) {
    console.error("Generate banner error:", err);
    return NextResponse.json({ error: "Failed to generate banner" }, { status: 500 });
  }
}

function escapeXml(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
