import { createWorker, OEM, PSM } from "tesseract.js";
import path from "path";
import { preprocessImage } from "./imageProcessor.js";
import pdf from "pdf-parse";

export interface PageBreakdown {
  pageIndex: number;
  imageSize: number;
  textLength: number;
  estimatedTokens: number;
}

let worker: Tesseract.Worker | null = null;
let workerReady = false;
let workerInitPromise: Promise<void> | null = null;

async function initWorker(): Promise<void> {
  if (workerReady) return;
  if (workerInitPromise) return workerInitPromise;

  workerInitPromise = (async () => {
    try {
      console.log("[OCR] Initializing Tesseract.js worker (eng+hin+ben)...");
      worker = await createWorker(["eng", "hin", "ben"], OEM.LSTM_ONLY, {
        langPath: path.resolve(__dirname, "../../tessdata"),
        logger: (m: { status: string; progress?: number }) => {
          if (m.status === "recognizing text") {
            console.log(`[OCR] Progress: ${Math.round((m.progress || 0) * 100)}%`);
          }
        },
      });

      await worker.setParameters({
        tessedit_pageseg_mode: PSM.AUTO,
        tessedit_do_invert: "0",
        textord_heavy_nr: "1",
        preserve_interword_spaces: "1",
        tessedit_enable_equation: "1",
        math_greek_script: "1",
      });

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

let pdfRaster: any = null;

async function getPdfRaster() {
  if (!pdfRaster) {
    pdfRaster = await import("@omsimos/pdf-raster");
  }
  return pdfRaster;
}

async function extractTextFromPDF(buffer: Buffer): Promise<{ text: string; pageBreakdown: PageBreakdown[] }> {
  try {
    const data = await pdf(buffer);
    const text = data.text?.trim();
    if (text && text.length > 0) {
      console.log(`[OCR] PDF text extracted via pdf-parse (${text.length} chars)`);
      const pageBreakdown = Array.from({ length: data.numpages }, (_, i) => ({
        pageIndex: i + 1,
        imageSize: 0,
        textLength: 0,
        estimatedTokens: 0,
      }));
      return { text: cleanText(text), pageBreakdown };
    }
  } catch {
    console.log("[OCR] pdf-parse failed, falling back to image-based OCR");
  }

  try {
    const { convert } = await getPdfRaster();
    const pages = await convert(buffer, { outputFormat: "jpeg", dpi: 300 });
    console.log(`[OCR] Processing ${pages.length} PDF pages as images...`);

    let fullText = "";
    const pageBreakdown: PageBreakdown[] = [];
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const text = await ocrImage(page.data);
      const clean = text.trim() ? text + "\n\n" : "";
      fullText += clean;
      pageBreakdown.push({
        pageIndex: i + 1,
        imageSize: page.data.length,
        textLength: text.length,
        estimatedTokens: Math.ceil(text.length / 4),
      });
    }

    // Cleanup: release in-memory page buffers (no temp files on disk)
    pages.length = 0;

    return { text: fullText.trim(), pageBreakdown };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`[OCR] PDF rendering failed: ${msg}`);
    throw new Error(
      "This PDF appears to be a scanned image with no extractable text. " +
      "Please try uploading individual page images (JPG/PNG) for better OCR results."
    );
  }
}

export function cleanText(text: string): string {
  let result = text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201c|\u201d/g, '"')
    .replace(/[®©™]/g, "")
    .replace(/•\s*/g, "- ");

  // Unicode normalization for Bengali and Hindi
  result = result.normalize("NFKC");

  // Remove incorrect spacing around Bengali characters (Unicode range: U+0980–U+09FF)
  result = result.replace(/([\u0980-\u09FF])\s+(?=[\u0980-\u09FF\u09BE-\u09D7])/g, "$1");
  result = result.replace(/([\u09BE-\u09D7])\s+(?=[\u0980-\u09FF])/g, "$1");

  // Remove incorrect spacing around Devanagari characters (Unicode range: U+0900–U+097F)
  result = result.replace(/([\u0900-\u097F])\s+(?=[\u0900-\u097F\u093E-\u094D])/g, "$1");
  result = result.replace(/([\u093E-\u094D])\s+(?=[\u0900-\u097F])/g, "$1");

  // Common math OCR fix patterns
  result = result
    .replace(/\\sqrt/g, "\\sqrt")
    .replace(/\\times/g, "\\times")
    .replace(/\\div/g, "\\div")
    .replace(/\\pm/g, "\\pm")
    .replace(/\\infty/g, "\\infty")
    .replace(/\\sum/g, "\\sum")
    .replace(/\\int/g, "\\int")
    .replace(/\\pi/g, "\\pi")
    .replace(/\\le/g, "\\le")
    .replace(/\\ge/g, "\\ge")
    .replace(/\\ne/g, "\\ne")
    .replace(/\\to/g, "\\to")
    .replace(/\\rightarrow/g, "\\rightarrow");

  return result
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
): Promise<{ text: string; pageBreakdown: PageBreakdown[] }> {
  if (mimeType === "application/pdf") {
    return await withTimeout(
      extractTextFromPDF(buffer),
      300_000,
      "OCR PDF processing"
    );
  }

  const raw = await ocrImage(buffer);
  const text = cleanText(raw);
  const pageBreakdown: PageBreakdown[] = [{
    pageIndex: 1,
    imageSize: buffer.length,
    textLength: text.length,
    estimatedTokens: Math.ceil(text.length / 4),
  }];
  return { text, pageBreakdown };
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
