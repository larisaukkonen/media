import { deleteBlob, loadStore, newId, saveStore } from "@/lib/blobStore";

const ONE_GIB = 1024 * 1024 * 1024;

async function getUsageBytes(userId: string) {
  const store = await loadStore();
  return store.mediaAssets
    .filter((item) => item.user_id === userId)
    .reduce((sum, item) => sum + Number(item.file_size ?? 0), 0);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  const store = await loadStore();
  const media = userId ? store.mediaAssets.filter((m) => m.user_id === userId) : store.mediaAssets;
  const usedBytes = userId ? await getUsageBytes(userId) : 0;
  return Response.json({ media, usage: { usedBytes, limitBytes: ONE_GIB } });
}

export async function POST(req: Request) {
  const { userId, fileUrl, fileName, fileSize, type, mimeType } = await req.json();

  const used = await getUsageBytes(userId);

  if ((used + Number(fileSize)) > ONE_GIB) {
    return Response.json({ error: "Storage quota exceeded" }, { status: 400 });
  }

  const store = await loadStore();
  const mediaId = newId();
  store.mediaAssets.push({
    id: mediaId,
    user_id: userId,
    file_url: fileUrl,
    file_name: fileName,
    file_size: Number(fileSize),
    type,
    mime_type: mimeType,
    created_at: new Date().toISOString()
  });
  await saveStore(store);
  return Response.json({ mediaId });
}

export async function DELETE(req: Request) {
  const { userId, mediaId } = await req.json();
  if (!userId || !mediaId) {
    return Response.json({ error: "Missing userId or mediaId" }, { status: 400 });
  }

  const store = await loadStore();
  const mediaItem = store.mediaAssets.find((item) => item.id === mediaId && item.user_id === userId);
  if (!mediaItem) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  store.mediaAssets = store.mediaAssets.filter((item) => item.id !== mediaId);
  await saveStore(store);
  await deleteBlob(mediaItem.file_url);
  const usedBytes = await getUsageBytes(userId);
  return Response.json({ ok: true, usage: { usedBytes, limitBytes: ONE_GIB } });
}
