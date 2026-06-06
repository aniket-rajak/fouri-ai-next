import sharp from "sharp";

export interface ProcessOptions {
  maxWidth?: number;
  maxHeight?: number;
  enhance?: boolean;
  threshold?: number;
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
      .median(1)
      .normalize()
      .sharpen({ sigma: 1.2 })
      .gamma(1.1)
      .linear(1.15, -15);
  }

  if (options.threshold !== undefined) {
    pipeline = pipeline.threshold(options.threshold);
  }

  return pipeline.jpeg({ quality: 95 }).toBuffer();
}
