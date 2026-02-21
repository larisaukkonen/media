import { pool } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET() {
  const { rows } = await pool.query(
    `SELECT id, email, created_at FROM app_users ORDER BY created_at DESC LIMIT 100`
  );

  return Response.json({ users: rows });
}

export async function POST(req: Request) {
  const { email } = await req.json();
  const userId = randomUUID();

  await pool.query(
    `INSERT INTO app_users (id, email) VALUES ($1, $2)`,
    [userId, email ?? null]
  );

  return Response.json({ userId });
}
