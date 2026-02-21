import { getOrCreateDefaultUser, loadStore, newId, saveStore, timestamp } from "@/lib/blobStore";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const store = await loadStore();
  await getOrCreateDefaultUser(store);
  const screens = userId ? store.screens.filter((s) => s.user_id === userId) : store.screens;
  return Response.json({ screens });
}

export async function POST(req: Request) {
  const { userId, name } = await req.json();
  const store = await loadStore();
  const screenId = newId();
  store.screens.push({
    id: screenId,
    user_id: userId,
    name,
    created_at: timestamp(),
    updated_at: timestamp()
  });
  await saveStore(store);
  return Response.json({ screenId });
}
