import { loadStore } from "@/lib/blobStore";

export async function GET(
  req: Request,
  { params }: { params: { deviceToken: string } }
) {
  const store = await loadStore();
  const monitor = store.monitors.find((m) => m.device_token === params.deviceToken);
  if (!monitor) {
    return Response.json({ error: "No screen assigned" }, { status: 404 });
  }

  const publish = store.monitorScreenPublish.find(
    (item) => item.monitor_id === monitor.id && item.is_active
  );
  if (!publish) {
    return Response.json({ error: "No screen assigned" }, { status: 404 });
  }

  const screenVersion = store.screenVersions.find((sv) => sv.id === publish.screen_version_id);
  if (!screenVersion) {
    return Response.json({ error: "No screen assigned" }, { status: 404 });
  }

  return Response.json(screenVersion);
}
