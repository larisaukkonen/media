import { pool } from "@/lib/db";
import { randomUUID } from "crypto";

export async function POST(
  req: Request,
  { params }: { params: { screenId: string } }
) {
  // Creates a new draft version for a screen
  const { title, layoutJson } = await req.json();
  const versionId = randomUUID();

  // Compute next version number
  const { rows } = await pool.query(
    `SELECT COALESCE(MAX(version), 0) + 1 AS next_version FROM screen_versions WHERE screen_id = $1`,
    [params.screenId]
  );
  const nextVersion = Number(rows[0]?.next_version ?? 1);

  await pool.query(
    `INSERT INTO screen_versions (id, screen_id, version, status, title, layout_json)
     VALUES ($1, $2, $3, 'draft', $4, $5::jsonb)`,
    [versionId, params.screenId, nextVersion, title ?? null, JSON.stringify(layoutJson ?? {})]
  );

  return Response.json({ versionId, version: nextVersion });
}
