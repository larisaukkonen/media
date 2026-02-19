import { pool } from "@/lib/db";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const { userId, name } = await req.json();
  const screenId = randomUUID();

  await pool.query(
    `INSERT INTO screens (id, user_id, name) VALUES ($1, $2, $3)`,
    [screenId, userId, name]
  );

  return Response.json({ screenId });
}
