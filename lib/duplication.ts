import { loadStore, newId, saveStore, timestamp } from "./blobStore";

export async function duplicateScreen(originalScreenId: string) {
  const store = await loadStore();
  const original = store.screens.find((screen) => screen.id === originalScreenId);
  if (!original) {
    throw new Error("Screen not found");
  }

  const newScreenId = newId();
  store.screens.push({
    id: newScreenId,
    user_id: original.user_id,
    name: `${original.name} (Copy)`,
    created_at: timestamp(),
    updated_at: timestamp()
  });

  await saveStore(store);
  return newScreenId;
}
