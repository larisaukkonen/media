import { pool } from "@/lib/db";
import { randomUUID } from "crypto";

const ONE_GIB = 1024 * 1024 * 1024;

export async function POST(req: Request) {
  const { userId, fileUrl, fileName, fileSize, type, mimeType } = await req.json();

  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(file_size), 0) AS total_bytes
     FROM media_assets
     WHERE user_id = $1`,
    [userId]
  );

  const used = Number(rows[0]?.total_bytes ?? 0);

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
