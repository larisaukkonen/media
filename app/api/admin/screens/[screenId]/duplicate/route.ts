import { duplicateScreen } from "@/lib/duplication";

export async function POST(
  req: Request,
  { params }: { params: { screenId: string } }
) {
  const newScreenId = await duplicateScreen(params.screenId);
  return Response.json({ newScreenId });
}
