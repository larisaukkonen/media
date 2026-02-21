import { pool } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const { rows } = userId
    ? await pool.query(
        `SELECT * FROM monitors WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
        [userId]
      )
    : await pool.query(
        `SELECT * FROM monitors ORDER BY created_at DESC LIMIT 100`
      );

  return Response.json({ monitors: rows });
}

export async function POST(req: Request) {
  const { userId, name, deviceToken } = await req.json();
  const monitorId = randomUUID();

  await pool.query(
    `INSERT INTO monitors (id, user_id, name, device_token) VALUES ($1, $2, $3, $4)`,
    [monitorId, userId, name, deviceToken]
  );

  return Response.json({ monitorId });
}
