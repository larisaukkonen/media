import { pool } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const { rows } = userId
    ? await pool.query(
        `SELECT * FROM scenes WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
        [userId]
      )
    : await pool.query(
        `SELECT * FROM scenes ORDER BY created_at DESC LIMIT 100`
      );

  return Response.json({ scenes: rows });
}

export async function POST(req: Request) {
  const { userId, name } = await req.json();
  const sceneId = randomUUID();

  await pool.query(
    `INSERT INTO scenes (id, user_id, name) VALUES ($1, $2, $3)`,
    [sceneId, userId, name]
  );

  return Response.json({ sceneId });
}
