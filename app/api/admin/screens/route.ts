import { pool } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const { rows } = userId
    ? await pool.query(
        `SELECT * FROM screens WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
        [userId]
      )
    : await pool.query(
        `SELECT * FROM screens ORDER BY created_at DESC LIMIT 100`
      );

  return Response.json({ screens: rows });
}

export async function POST(req: Request) {
  const { userId, name } = await req.json();
  const screenId = randomUUID();

  await pool.query(
    `INSERT INTO screens (id, user_id, name) VALUES ($1, $2, $3)`,
    [screenId, userId, name]
  );

  return Response.json({ screenId });
}
