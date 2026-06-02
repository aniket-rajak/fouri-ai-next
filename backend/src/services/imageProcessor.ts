import sharp from "sharp";

export interface ProcessOptions {
  maxWidth?: number;
  maxHeight?: number;
  enhance?: boolean;
}

export async function preprocessImage(
  buffer: Buffer,
  options: ProcessOptions = {}
): Promise<Buffer> {
  const {
    maxWidth = 2000,
    maxHeight = 2000,
    enhance = true,
  } = options;

  const metadata = await sharp(buffer).metadata();

  let pipeline = sharp(buffer);

  if (
    (metadata.width && metadata.width > maxWidth) ||
    (metadata.height && metadata.height > maxHeight)
  ) {
    pipeline = pipeline.resize(maxWidth, maxHeight, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  if (enhance) {
    pipeline = pipeline
      .grayscale()
      .normalize()
      .sharpen()
      .modulate({ brightness: 1.1 });
  }

  return pipeline.jpeg({ quality: 80 }).toBuffer();
}
