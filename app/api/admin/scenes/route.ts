import { getOrCreateDefaultUser, loadStore, newId, saveStore, timestamp } from "@/lib/blobStore";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const store = await loadStore();
  await getOrCreateDefaultUser(store);
  const scenes = userId ? store.scenes.filter((s) => s.user_id === userId) : store.scenes;
  return Response.json({ scenes });
}

export async function POST(req: Request) {
  const { userId, name } = await req.json();
  const store = await loadStore();
  const defaultUser = await getOrCreateDefaultUser(store);
  const sceneId = newId();
  store.scenes.push({
    id: sceneId,
    user_id: userId ?? defaultUser.id,
    name,
    created_at: timestamp(),
    updated_at: timestamp()
  });
  await saveStore(store);
  return Response.json({ sceneId });
}
