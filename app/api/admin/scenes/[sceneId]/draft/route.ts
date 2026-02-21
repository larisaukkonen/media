import { loadStore, newId, saveStore, timestamp } from "@/lib/blobStore";

async function getOrCreateDraft(sceneId: string) {
  const store = await loadStore();
  let draft = store.sceneVersions
    .filter((item) => item.scene_id === sceneId && item.status === "draft")
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

  if (draft) {
    return { draft, store };
  }

  const versionId = newId();
  const nextVersion =
    Math.max(
      0,
      ...store.sceneVersions.filter((v) => v.scene_id === sceneId).map((v) => v.version)
    ) + 1;

  const dataJson = { timeline: [] };
  draft = {
    id: versionId,
    scene_id: sceneId,
    version: nextVersion,
    status: "draft",
    data_json: dataJson,
    created_at: timestamp()
  };
  store.sceneVersions.push(draft);
  await saveStore(store);
  return { draft, store };
}

export async function GET(
  req: Request,
  { params }: { params: { sceneId: string } }
) {
  const { draft } = await getOrCreateDraft(params.sceneId);
  return Response.json({ draft });
}

export async function PATCH(
  req: Request,
  { params }: { params: { sceneId: string } }
) {
  const { dataJson } = await req.json();
  const { draft, store } = await getOrCreateDraft(params.sceneId);
  const updated = {
    ...draft,
    data_json: dataJson ?? draft.data_json ?? {}
  };
  store.sceneVersions = store.sceneVersions.map((item) => (item.id === draft.id ? updated : item));
  await saveStore(store);
  return Response.json({ draft: updated });
}
