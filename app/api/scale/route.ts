import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { RETAILER_PRESETS } from "@/lib/presets";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;
    const mode = formData.get("mode") as string;

    if (!imageFile) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());

    if (mode === "walmart" || mode === "target") {
      return await handleRetailer(imageBuffer, mode);
    } else if (mode === "banner") {
      const bannerFile = formData.get("banner") as File | null;
      const position = (formData.get("position") as string) || "top";
      const opacity = parseFloat((formData.get("opacity") as string) || "1");
      if (!bannerFile) {
        return NextResponse.json({ error: "No banner image provided" }, { status: 400 });
      }
      const bannerBuffer = Buffer.from(await bannerFile.arrayBuffer());
      return await handleBanner(imageBuffer, bannerBuffer, position as "top" | "bottom" | "overlay", opacity);
    } else if (mode === "manual") {
      const width = parseInt(formData.get("width") as string);
      const height = parseInt(formData.get("height") as string);
      const fit = (formData.get("fit") as string) || "contain";
      if (!width || !height) {
        return NextResponse.json({ error: "Width and height required" }, { status: 400 });
      }
      return await handleManual(imageBuffer, width, height, fit as "contain" | "cover");
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Scale API error:", message, err);
    return NextResponse.json({ error: `Processing failed: ${message}` }, { status: 500 });
  }
}

async function handleRetailer(imageBuffer: Buffer, retailer: "walmart" | "target") {
  const preset = RETAILER_PRESETS[retailer];
  const results = [];

  for (const size of preset.sizes) {
    let pipeline = sharp(imageBuffer).resize(size.width, size.height, {
      fit: "contain",
      background: preset.background
        ? hexToRgba(preset.background)
        : { r: 0, g: 0, b: 0, alpha: 0 },
    });

    let outputBuffer: Buffer;
    let mimeType: string;
    let ext: string;

    if (preset.format === "jpeg") {
      outputBuffer = await pipeline.jpeg({ quality: 92 }).toBuffer();
      mimeType = "image/jpeg";
      ext = "jpg";
    } else {
      outputBuffer = await pipeline.png().toBuffer();
      mimeType = "image/png";
      ext = "png";
    }

    const base64 = outputBuffer.toString("base64");
    results.push({
      label: `${size.label} (${preset.name})`,
      width: size.width,
      height: size.height,
      url: `data:${mimeType};base64,${base64}`,
      filename: `${retailer}_${size.label.toLowerCase().replace(/\s+/g, "_")}_${size.width}x${size.height}.${ext}`,
    });
  }

  return NextResponse.json({ results });
}

async function handleBanner(
  imageBuffer: Buffer,
  bannerBuffer: Buffer,
  position: "top" | "bottom" | "overlay",
  opacity: number
) {
  const baseImage = sharp(imageBuffer);
  const baseMeta = await baseImage.metadata();
  const baseWidth = baseMeta.width!;
  const baseHeight = baseMeta.height!;

  // Resize banner to match base width
  const resizedBanner = await sharp(bannerBuffer)
    .resize(baseWidth, undefined, { fit: "inside" })
    .ensureAlpha()
    .toBuffer();

  const bannerMeta = await sharp(resizedBanner).metadata();
  const bannerHeight = bannerMeta.height!;

  let compositeOptions: sharp.OverlayOptions;
  let outputWidth = baseWidth;
  let outputHeight = baseHeight;

  if (position === "overlay") {
    // Center overlay
    const top = Math.round((baseHeight - bannerHeight) / 2);
    compositeOptions = {
      input: await sharp(resizedBanner)
        .composite([{
          input: Buffer.from([255, 255, 255, Math.round(opacity * 255)]),
          raw: { width: 1, height: 1, channels: 4 },
          tile: true,
          blend: "dest-in",
        }])
        .toBuffer(),
      top: Math.max(0, top),
      left: 0,
    };
  } else {
    // Top or bottom: extend canvas
    outputHeight = baseHeight + bannerHeight;
    const bgBuffer = await sharp({
      create: {
        width: outputWidth,
        height: outputHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    }).png().toBuffer();

    const baseTop = position === "top" ? bannerHeight : 0;
    const bannerTop = position === "top" ? 0 : baseHeight;

    // Apply opacity to banner
    const bannerWithOpacity = await sharp(resizedBanner)
      .composite([{
        input: Buffer.from([255, 255, 255, Math.round(opacity * 255)]),
        raw: { width: 1, height: 1, channels: 4 },
        tile: true,
        blend: "dest-in",
      }])
      .toBuffer();

    const result = await sharp(bgBuffer)
      .composite([
        { input: imageBuffer, top: baseTop, left: 0 },
        { input: bannerWithOpacity, top: bannerTop, left: 0 },
      ])
      .png()
      .toBuffer();

    const base64 = result.toString("base64");
    return NextResponse.json({
      results: [{
        label: `With Banner (${position})`,
        width: outputWidth,
        height: outputHeight,
        url: `data:image/png;base64,${base64}`,
        filename: `banner_${position}_${outputWidth}x${outputHeight}.png`,
      }],
    });
  }

  // Overlay mode
  const result = await sharp(imageBuffer)
    .composite([compositeOptions])
    .png()
    .toBuffer();

  const base64 = result.toString("base64");
  return NextResponse.json({
    results: [{
      label: `With Banner (overlay)`,
      width: outputWidth,
      height: outputHeight,
      url: `data:image/png;base64,${base64}`,
      filename: `banner_overlay_${outputWidth}x${outputHeight}.png`,
    }],
  });
}

async function handleManual(
  imageBuffer: Buffer,
  width: number,
  height: number,
  fit: "contain" | "cover"
) {
  const outputBuffer = await sharp(imageBuffer)
    .resize(width, height, {
      fit,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toBuffer();

  const base64 = outputBuffer.toString("base64");
  return NextResponse.json({
    results: [{
      label: `Custom (${fit})`,
      width,
      height,
      url: `data:image/png;base64,${base64}`,
      filename: `custom_${width}x${height}.png`,
    }],
  });
}

function hexToRgba(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b, alpha: 1 };
}
