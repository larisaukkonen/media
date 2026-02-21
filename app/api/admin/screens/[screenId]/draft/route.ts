import { loadStore, newId, saveStore, timestamp } from "@/lib/blobStore";

async function getOrCreateDraft(screenId: string) {
  const store = await loadStore();
  let draft = store.screenVersions
    .filter((item) => item.screen_id === screenId && item.status === "draft")
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

  if (draft) {
    return { draft, store };
  }

  const versionId = newId();
  const nextVersion =
    Math.max(
      0,
      ...store.screenVersions.filter((v) => v.screen_id === screenId).map((v) => v.version)
    ) + 1;

  const layoutJson = {
    orientation: "landscape",
    rows: 1,
    cols: 1,
    cells: [{ id: "0-0", sceneId: null }]
  };

  draft = {
    id: versionId,
    screen_id: screenId,
    version: nextVersion,
    status: "draft",
    title: "Draft",
    layout_json: layoutJson,
    created_at: timestamp()
  };

  store.screenVersions.push(draft);
  await saveStore(store);
  return { draft, store };
}

export async function GET(
  req: Request,
  { params }: { params: { screenId: string } }
) {
  const { draft } = await getOrCreateDraft(params.screenId);
  return Response.json({ draft });
}

export async function PATCH(
  req: Request,
  { params }: { params: { screenId: string } }
) {
  const { title, layoutJson } = await req.json();
  const { draft, store } = await getOrCreateDraft(params.screenId);
  const updated = {
    ...draft,
    title: title ?? draft.title,
    layout_json: layoutJson ?? draft.layout_json ?? {}
  };
  store.screenVersions = store.screenVersions.map((item) => (item.id === draft.id ? updated : item));
  await saveStore(store);
  return Response.json({ draft: updated });
}

export async function POST(
  req: Request,
  { params }: { params: { screenId: string } }
) {
  // Creates a new draft version for a screen (explicit)
  const { title, layoutJson } = await req.json();
  const store = await loadStore();
  const versionId = newId();
  const nextVersion =
    Math.max(
      0,
      ...store.screenVersions.filter((v) => v.screen_id === params.screenId).map((v) => v.version)
    ) + 1;
  const draft = {
    id: versionId,
    screen_id: params.screenId,
    version: nextVersion,
    status: "draft",
    title: title ?? null,
    layout_json: layoutJson ?? {},
    created_at: timestamp()
  };
  store.screenVersions.push(draft);
  await saveStore(store);
  return Response.json({ versionId, version: nextVersion });
}
