import { env } from "../config/env.js";

const BOT_TOKEN = env.telegram.botToken;
const CHANNEL_ID = env.telegram.channelId;
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

interface TelegramFileResult {
  fileId: string;
  cdnUrl: string;
}

interface TelegramResponse<T> {
  ok: boolean;
  result?: T;
  description?: string;
}

export async function uploadToTelegram(
  buffer: Buffer,
  filename: string
): Promise<TelegramFileResult> {
  if (!BOT_TOKEN || !CHANNEL_ID) {
    throw new Error("Telegram storage not configured (missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHANNEL_ID)");
  }

  const formData = new FormData();
  const blob = new Blob([buffer], { type: "application/octet-stream" });
  formData.append("document", blob, filename);
  formData.append("chat_id", CHANNEL_ID);

  const response = await fetch(`${API_BASE}/sendDocument`, {
    method: "POST",
    body: formData,
  });

  const data = (await response.json()) as TelegramResponse<{
    document?: { file_id: string };
    audio?: { file_id: string };
    video?: { file_id: string };
    photo?: Array<{ file_id: string }>;
  }>;

  if (!data.ok) {
    throw new Error(`Telegram upload failed: ${data.description || "Unknown error"}`);
  }

  const result = data.result;
  const fileId =
    result?.document?.file_id ||
    result?.audio?.file_id ||
    result?.video?.file_id ||
    (result?.photo && result.photo[0]?.file_id);

  if (!fileId) {
    throw new Error("Telegram upload succeeded but no file_id returned");
  }

  const cdnUrl = await getTelegramFileUrl(fileId);

  return { fileId, cdnUrl };
}

export async function getTelegramFileUrl(fileId: string): Promise<string> {
  const response = await fetch(`${API_BASE}/getFile?file_id=${fileId}`);
  const data = (await response.json()) as TelegramResponse<{
    file_path: string;
  }>;

  if (!data.ok || !data.result?.file_path) {
    throw new Error(`Telegram getFile failed: ${data.description || "Unknown error"}`);
  }

  return `https://api.telegram.org/file/bot${BOT_TOKEN}/${encodeURI(data.result.file_path)}`;
}

export async function downloadTelegramFile(fileId: string): Promise<Buffer> {
  const url = await getTelegramFileUrl(fileId);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file from Telegram: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
