import { pool } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { screenId: string } }
) {
  const { rows } = await pool.query(
    `SELECT * FROM screens WHERE id = $1`,
    [params.screenId]
  );

  if (!rows.length) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(rows[0]);
}
