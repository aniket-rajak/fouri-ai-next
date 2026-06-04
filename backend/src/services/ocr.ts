import { createWorker } from "tesseract.js";
import { preprocessImage } from "./imageProcessor.js";
import pdf from "pdf-parse";
import sharp from "sharp";

let worker: Tesseract.Worker | null = null;
let workerReady = false;
let workerInitPromise: Promise<void> | null = null;

async function initWorker(): Promise<void> {
  if (workerReady) return;
  if (workerInitPromise) return workerInitPromise;

  workerInitPromise = (async () => {
    try {
      console.log("[OCR] Initializing Tesseract.js worker (eng+hin+ben)...");
      worker = await createWorker("eng+hin+ben");
      workerReady = true;
      console.log("[OCR] Worker ready");
    } catch (error) {
      workerInitPromise = null;
      throw error;
    }
  })();

  return workerInitPromise;
}

async function getWorker(): Promise<Tesseract.Worker> {
  if (!workerReady || !worker) {
    await initWorker();
  }
  return worker!;
}

async function ocrImage(buffer: Buffer, retries = 2): Promise<string> {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const w = await getWorker();
      const processed = await preprocessImage(buffer);
      const { data } = await w.recognize(processed);
      return data.text || "";
    } catch (error) {
      if (attempt > retries) throw error;
      console.log(`[OCR] Attempt ${attempt} failed, retrying...`);
      worker?.terminate().catch(() => {});
      worker = null;
      workerReady = false;
      workerInitPromise = null;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  return "";
}

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    const text = data.text?.trim();
    if (text && text.length > 50) {
      console.log(`[OCR] PDF text extracted via pdf-parse (${text.length} chars)`);
      return cleanText(text);
    }
  } catch {
    console.log("[OCR] pdf-parse failed, falling back to image-based OCR");
  }

  const metadata = await sharp(buffer, { pages: -1 }).metadata();
  const pageCount = metadata.pages || 1;
  console.log(`[OCR] Processing ${pageCount} PDF pages as images...`);

  let fullText = "";
  for (let i = 0; i < pageCount; i++) {
    const pageBuffer = await sharp(buffer, { page: i })
      .jpeg({ quality: 85 })
      .toBuffer();

    const text = await ocrImage(pageBuffer);
    if (text.trim()) {
      fullText += text + "\n\n";
    }
  }

  return fullText.trim();
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

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms / 1000}s: ${label}`)), ms)
    ),
  ]);
}

export async function extractText(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType === "application/pdf") {
    return await withTimeout(
      extractTextFromPDF(buffer),
      300_000,
      "OCR PDF processing"
    );
  }

  const raw = await ocrImage(buffer);
  return cleanText(raw);
}

process.on("SIGTERM", async () => {
  if (worker) {
    await worker.terminate().catch(() => {});
  }
});

process.on("SIGINT", async () => {
  if (worker) {
    await worker.terminate().catch(() => {});
  }
});
