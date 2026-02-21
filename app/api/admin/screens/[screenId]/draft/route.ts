import { pool } from "@/lib/db";
import { randomUUID } from "crypto";

async function getOrCreateDraft(screenId: string) {
  const { rows } = await pool.query(
    `SELECT * FROM screen_versions
     WHERE screen_id = $1 AND status = 'draft'
     ORDER BY created_at DESC
     LIMIT 1`,
    [screenId]
  );

  if (rows.length) {
    return rows[0];
  }

  const versionId = randomUUID();
  const { rows: versionRows } = await pool.query(
    `SELECT COALESCE(MAX(version), 0) + 1 AS next_version FROM screen_versions WHERE screen_id = $1`,
    [screenId]
  );
  const nextVersion = Number(versionRows[0]?.next_version ?? 1);

  const layoutJson = {
    orientation: "landscape",
    rows: 1,
    cols: 1,
    cells: [{ id: "0-0", sceneId: null }]
  };

  await pool.query(
    `INSERT INTO screen_versions (id, screen_id, version, status, title, layout_json)
     VALUES ($1, $2, $3, 'draft', $4, $5::jsonb)`,
    [versionId, screenId, nextVersion, "Draft", JSON.stringify(layoutJson)]
  );

  const { rows: createdRows } = await pool.query(
    `SELECT * FROM screen_versions WHERE id = $1`,
    [versionId]
  );

  return createdRows[0];
}

export async function GET(
  req: Request,
  { params }: { params: { screenId: string } }
) {
  const draft = await getOrCreateDraft(params.screenId);
  return Response.json({ draft });
}

export async function PATCH(
  req: Request,
  { params }: { params: { screenId: string } }
) {
  const { title, layoutJson } = await req.json();
  const draft = await getOrCreateDraft(params.screenId);

  await pool.query(
    `UPDATE screen_versions SET title = $2, layout_json = $3::jsonb WHERE id = $1`,
    [draft.id, title ?? draft.title, JSON.stringify(layoutJson ?? draft.layout_json ?? {})]
  );

  const { rows } = await pool.query(
    `SELECT * FROM screen_versions WHERE id = $1`,
    [draft.id]
  );

  return Response.json({ draft: rows[0] });
}

export async function POST(
  req: Request,
  { params }: { params: { screenId: string } }
) {
  // Creates a new draft version for a screen (explicit)
  const { title, layoutJson } = await req.json();
  const versionId = randomUUID();

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
