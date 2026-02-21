import { del, head, put } from "@vercel/blob";
import { randomUUID } from "crypto";

const DATA_KEY = "media-admin/data.json";
const DEFAULT_EMAIL = "lari.saukkonen@gmail.com";

export type AppUser = { id: string; email: string | null; created_at: string };
export type Screen = { id: string; user_id: string; name: string; created_at: string; updated_at: string };
export type ScreenVersion = {
  id: string;
  screen_id: string;
  version: number;
  status: "draft" | "published" | "archived";
  title: string | null;
  layout_json: unknown;
  created_at: string;
};
export type Monitor = {
  id: string;
  user_id: string;
  name: string;
  device_token: string;
  created_at: string;
  updated_at: string;
};
export type MonitorScreenPublish = {
  id: string;
  monitor_id: string;
  screen_version_id: string;
  is_active: boolean;
  published_at: string;
};
export type MediaAsset = {
  id: string;
  user_id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  type: "image" | "video";
  mime_type: string;
  duration_ms?: number | null;
  created_at: string;
};
export type Scene = { id: string; user_id: string; name: string; created_at: string; updated_at: string };
export type SceneVersion = {
  id: string;
  scene_id: string;
  version: number;
  status: "draft" | "published" | "archived";
  data_json: unknown;
  created_at: string;
};

export type Store = {
  users: AppUser[];
  screens: Screen[];
  screenVersions: ScreenVersion[];
  monitors: Monitor[];
  monitorScreenPublish: MonitorScreenPublish[];
  mediaAssets: MediaAsset[];
  scenes: Scene[];
  sceneVersions: SceneVersion[];
};

function nowIso() {
  return new Date().toISOString();
}

function emptyStore(): Store {
  return {
    users: [],
    screens: [],
    screenVersions: [],
    monitors: [],
    monitorScreenPublish: [],
    mediaAssets: [],
    scenes: [],
    sceneVersions: []
  };
}

export async function loadStore(): Promise<Store> {
  try {
    const info = await head(DATA_KEY);
    const res = await fetch(info.url);
    if (!res.ok) {
      return emptyStore();
    }
    const json = (await res.json()) as Store;
    return json ?? emptyStore();
  } catch {
    return emptyStore();
  }
}

export async function saveStore(store: Store) {
  await put(DATA_KEY, JSON.stringify(store), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json"
  });
}

export async function deleteBlob(url: string) {
  try {
    await del(url);
  } catch {
    // ignore
  }
}

export async function getOrCreateDefaultUser(store: Store): Promise<AppUser> {
  let user = store.users.find((item) => item.email === DEFAULT_EMAIL);
  if (!user) {
    user = { id: randomUUID(), email: DEFAULT_EMAIL, created_at: nowIso() };
    store.users.push(user);
    await saveStore(store);
  }
  return user;
}

export function getDefaultEmail() {
  return DEFAULT_EMAIL;
}

export function newId() {
  return randomUUID();
}

export function timestamp() {
  return nowIso();
}
