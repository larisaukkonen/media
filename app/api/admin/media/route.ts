import { pool } from "@/lib/db";
import { randomUUID } from "crypto";

const ONE_GIB = 1024 * 1024 * 1024;

async function getUsageBytes(userId: string) {
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(file_size), 0) AS total_bytes
     FROM media_assets
     WHERE user_id = $1`,
    [userId]
  );

  return Number(rows[0]?.total_bytes ?? 0);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const { rows } = userId
    ? await pool.query(
        `SELECT * FROM media_assets WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
        [userId]
      )
    : await pool.query(
        `SELECT * FROM media_assets ORDER BY created_at DESC LIMIT 100`
      );

  const usedBytes = userId ? await getUsageBytes(userId) : 0;
  return Response.json({ media: rows, usage: { usedBytes, limitBytes: ONE_GIB } });
}

export async function POST(req: Request) {
  const { userId, fileUrl, fileName, fileSize, type, mimeType } = await req.json();

  const used = await getUsageBytes(userId);

  if ((used + Number(fileSize)) > ONE_GIB) {
    return Response.json({ error: "Storage quota exceeded" }, { status: 400 });
  }

  const mediaId = randomUUID();
  await pool.query(
    `INSERT INTO media_assets (id, user_id, file_url, file_name, file_size, type, mime_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [mediaId, userId, fileUrl, fileName, fileSize, type, mimeType]
  );

  return Response.json({ mediaId });
}
