import { pool } from "@/lib/db";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const { userId, name, deviceToken } = await req.json();
  const monitorId = randomUUID();

  await pool.query(
    `INSERT INTO monitors (id, user_id, name, device_token) VALUES ($1, $2, $3, $4)`,
    [monitorId, userId, name, deviceToken]
  );

  return Response.json({ monitorId });
}
