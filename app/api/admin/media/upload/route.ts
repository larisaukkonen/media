import { pool } from "@/lib/db";
import { handleUpload } from "@vercel/blob/client";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

const ONE_GIB = 1024 * 1024 * 1024;

type UploadPayload = {
  userId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  type: "image" | "video";
};

async function getUsageBytes(userId: string) {
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(file_size), 0) AS total_bytes
     FROM media_assets
     WHERE user_id = $1`,
    [userId]
  );

  return Number(rows[0]?.total_bytes ?? 0);
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();

  return handleUpload({
    body,
    request,
    onBeforeGenerateToken: async (_pathname, clientPayload) => {
      const payload = (typeof clientPayload === "string"
        ? JSON.parse(clientPayload)
        : clientPayload) as UploadPayload | undefined;

      if (!payload?.userId || !payload?.fileSize) {
        throw new Error("Missing upload payload.");
      }

      const used = await getUsageBytes(payload.userId);
      if (used + payload.fileSize > ONE_GIB) {
        throw new Error("Storage quota exceeded.");
      }

      return {
        allowedContentTypes: [payload.mimeType],
        tokenPayload: JSON.stringify(payload)
      };
    },
    onUploadCompleted: async ({ blob, tokenPayload }) => {
      const payload = tokenPayload ? (JSON.parse(tokenPayload) as UploadPayload) : null;
      if (!payload) return;

      const used = await getUsageBytes(payload.userId);
      if (used + payload.fileSize > ONE_GIB) {
        return;
      }

      const mediaId = randomUUID();
      await pool.query(
        `INSERT INTO media_assets (id, user_id, file_url, file_name, file_size, type, mime_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [mediaId, payload.userId, blob.url, payload.fileName, payload.fileSize, payload.type, payload.mimeType]
      );
    }
  });
}
