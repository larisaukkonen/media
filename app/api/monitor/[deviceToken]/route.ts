import { pool } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { deviceToken: string } }
) {
  const { rows } = await pool.query(
    `
    SELECT sv.*
    FROM monitors m
    JOIN monitor_screen_publish msp
      ON m.id = msp.monitor_id
    JOIN screen_versions sv
      ON sv.id = msp.screen_version_id
    WHERE m.device_token = $1
      AND msp.is_active = TRUE
    LIMIT 1
    `,
    [params.deviceToken]
  );

  if (!rows.length) {
    return Response.json({ error: "No screen assigned" }, { status: 404 });
  }

  return Response.json(rows[0]);
}
