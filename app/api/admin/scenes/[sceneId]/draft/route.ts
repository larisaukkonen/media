import { pool } from "@/lib/db";
import { randomUUID } from "crypto";

async function getOrCreateDraft(sceneId: string) {
  const { rows } = await pool.query(
    `SELECT * FROM scene_versions
     WHERE scene_id = $1 AND status = 'draft'
     ORDER BY created_at DESC
     LIMIT 1`,
    [sceneId]
  );

  if (rows.length) {
    return rows[0];
  }

  const versionId = randomUUID();
  const { rows: versionRows } = await pool.query(
    `SELECT COALESCE(MAX(version), 0) + 1 AS next_version FROM scene_versions WHERE scene_id = $1`,
    [sceneId]
  );
  const nextVersion = Number(versionRows[0]?.next_version ?? 1);

  const dataJson = {
    timeline: []
  };

  await pool.query(
    `INSERT INTO scene_versions (id, scene_id, version, status, data_json)
     VALUES ($1, $2, $3, 'draft', $4::jsonb)`,
    [versionId, sceneId, nextVersion, JSON.stringify(dataJson)]
  );

  const { rows: createdRows } = await pool.query(
    `SELECT * FROM scene_versions WHERE id = $1`,
    [versionId]
  );

  return createdRows[0];
}

export async function GET(
  req: Request,
  { params }: { params: { sceneId: string } }
) {
  const draft = await getOrCreateDraft(params.sceneId);
  return Response.json({ draft });
}

export async function PATCH(
  req: Request,
  { params }: { params: { sceneId: string } }
) {
  const { dataJson } = await req.json();
  const draft = await getOrCreateDraft(params.sceneId);

  await pool.query(
    `UPDATE scene_versions SET data_json = $2::jsonb WHERE id = $1`,
    [draft.id, JSON.stringify(dataJson ?? draft.data_json ?? {})]
  );

  const { rows } = await pool.query(
    `SELECT * FROM scene_versions WHERE id = $1`,
    [draft.id]
  );

  return Response.json({ draft: rows[0] });
}
