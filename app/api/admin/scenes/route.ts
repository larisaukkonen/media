import { pool } from "@/lib/db";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const { userId, name } = await req.json();
  const sceneId = randomUUID();

  await pool.query(
    `INSERT INTO scenes (id, user_id, name) VALUES ($1, $2, $3)`,
    [sceneId, userId, name]
  );

  return Response.json({ sceneId });
}
