import { getOrCreateDefaultUser, loadStore, newId, saveStore, timestamp } from "@/lib/blobStore";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const store = await loadStore();
  await getOrCreateDefaultUser(store);
  const monitors = userId ? store.monitors.filter((m) => m.user_id === userId) : store.monitors;
  return Response.json({ monitors });
}

export async function POST(req: Request) {
  const { userId, name, deviceToken } = await req.json();
  const store = await loadStore();
  const monitorId = newId();
  store.monitors.push({
    id: monitorId,
    user_id: userId,
    name,
    device_token: deviceToken,
    created_at: timestamp(),
    updated_at: timestamp()
  });
  await saveStore(store);
  return Response.json({ monitorId });
}
