import { loadStore } from "@/lib/blobStore";

export async function GET(
  req: Request,
  { params }: { params: { screenId: string } }
) {
  const store = await loadStore();
  const screen = store.screens.find((item) => item.id === params.screenId);
  if (!screen) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(screen);
}
