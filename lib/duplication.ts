import { randomUUID } from "crypto";
import { withTransaction } from "./transactions";

export async function duplicateScreen(originalScreenId: string) {
  const newScreenId = randomUUID();

  await withTransaction(async (client) => {
    await client.query(
      `
      INSERT INTO screens (id, user_id, name)
      SELECT $1, user_id, name || ' (Copy)'
      FROM screens
      WHERE id = $2
      `,
      [newScreenId, originalScreenId]
    );

    // TODO: Duplicate screen_versions, scenes, scene_version_items (depending on your data model)
  });

  return newScreenId;
}
