import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { getTelegramFileUrl, downloadTelegramFile } from "../services/telegramStorage.js";

const router = Router();

const EXT_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
};

const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(
  url: string,
  retries: number = 3
): Promise<{ buffer: Buffer; mime: string }> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const mime = response.headers.get("content-type") || "";
      const buffer = Buffer.from(await response.arrayBuffer());
      return { buffer, mime };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error("Unknown error");
      if (attempt < retries) {
        await sleep(attempt * 1000);
      }
    }
  }

  throw lastError!;
}

async function resolveImage(
  fileId: string
): Promise<{ buffer: Buffer; mime: string } | null> {
  const media = await prisma.mediaFile.findFirst({
    where: { fileId },
    select: { mimeType: true, cdnUrl: true },
  });

  if (media?.cdnUrl) {
    try {
      const result = await fetchWithRetry(media.cdnUrl);
      if (!result.mime.startsWith("image/")) {
        const ext = (media.cdnUrl.split(".").pop() || "").toLowerCase();
        result.mime = EXT_MIME[ext] || media.mimeType;
      }
      return result;
    } catch (err) {
      console.error(
        `[FileProxy] CDN fetch failed for ${fileId}, falling back to getFile:`,
        (err as Error).message
      );
    }
  }

  try {
    const buffer = await downloadTelegramFile(fileId);
    let mime = media?.mimeType || "";
    if (!mime) {
      const url = await getTelegramFileUrl(fileId);
      const ext = (url.split(".").pop() || "").toLowerCase();
      mime = EXT_MIME[ext] || "image/png";
    }
    return { buffer, mime };
  } catch (err) {
    console.error(
      `[FileProxy] getFile download failed for ${fileId}:`,
      (err as Error).message
    );
    return null;
  }
}

router.get("/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;
    if (!fileId) {
      res.set("Content-Type", "image/gif");
      res.send(TRANSPARENT_GIF);
      return;
    }

    const result = await resolveImage(fileId);
    if (!result) {
      res.set("Content-Type", "image/gif");
      res.send(TRANSPARENT_GIF);
      return;
    }

    res.set("Content-Type", result.mime);
    res.set("Cache-Control", "public, max-age=86400");
    res.set("Content-Length", result.buffer.length.toString());
    res.set("X-Content-Type-Options", "nosniff");
    res.send(result.buffer);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("File proxy error — fileId:", req.params.fileId, "error:", msg);
    res.set("Content-Type", "image/gif");
    res.send(TRANSPARENT_GIF);
  }
});

export default router;
