import { ImageAnnotatorClient } from "@google-cloud/vision";
import { env } from "../config/env.js";

let client: ImageAnnotatorClient | null = null;

function getClient(): ImageAnnotatorClient {
  if (!client) {
    const credentials = (() => {
      try {
        return JSON.parse(env.googleVision.credentials);
      } catch {
        return undefined;
      }
    })();

    if (credentials) {
      client = new ImageAnnotatorClient({ credentials });
    } else {
      client = new ImageAnnotatorClient();
    }
  }
  return client;
}

async function fetchImageBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function ocrWithRetry(
  buffer: Buffer,
  mimeType: string,
  retries = 3
): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const c = getClient();

      if (mimeType === "application/pdf") {
        const [result] = await c.annotateImage({
          image: { content: buffer.toString("base64") },
          features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
          imageContext: { languageHints: ["en", "hi"] },
        });
        return result.fullTextAnnotation?.text || "";
      }

      const [result] = await c.textDetection({
        image: { content: buffer.toString("base64") },
        imageContext: { languageHints: ["en", "hi"] },
      });
      return result.fullTextAnnotation?.text || "";
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  return "";
}

export function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201c|\u201d/g, '"')
    .replace(/[®©™]/g, "")
    .replace(/•\s*/g, "- ")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}

export async function extractText(
  imageUrl: string,
  mimeType: string
): Promise<string> {
  const buffer = await fetchImageBuffer(imageUrl);
  const raw = await ocrWithRetry(buffer, mimeType);
  return cleanText(raw);
}
