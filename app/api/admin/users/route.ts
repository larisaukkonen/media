import { getOrCreateDefaultUser, loadStore, newId, saveStore, timestamp } from "@/lib/blobStore";

export async function GET() {
  const store = await loadStore();
  await getOrCreateDefaultUser(store);
  return Response.json({ users: store.users });
}

export async function POST(req: Request) {
  const { email } = await req.json();
  const store = await loadStore();
  const userId = newId();
  store.users.push({ id: userId, email: email ?? null, created_at: timestamp() });
  await saveStore(store);
  return Response.json({ userId });
}
