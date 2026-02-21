import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { loadStore, newId, saveStore } from "@/lib/blobStore";
import { NextResponse } from "next/server";

const ONE_GIB = 1024 * 1024 * 1024;

type UploadPayload = {
  userId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  type: "image" | "video";
};

async function getUsageBytes(userId: string) {
  const store = await loadStore();
  return store.mediaAssets
    .filter((item) => item.user_id === userId)
    .reduce((sum, item) => sum + Number(item.file_size ?? 0), 0);
}

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const payload = (typeof clientPayload === "string"
          ? JSON.parse(clientPayload)
          : clientPayload) as UploadPayload | undefined;

        if (!payload?.userId || !payload?.fileSize) {
          throw new Error("Missing upload payload.");
        }

        const used = await getUsageBytes(payload.userId);
        if (used + payload.fileSize > ONE_GIB) {
          throw new Error("Storage quota exceeded.");
        }

        return {
          allowedContentTypes: [payload.mimeType],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify(payload)
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = tokenPayload ? (JSON.parse(tokenPayload) as UploadPayload) : null;
        if (!payload) return;

        const used = await getUsageBytes(payload.userId);
        if (used + payload.fileSize > ONE_GIB) {
          return;
        }

        const store = await loadStore();
        const mediaId = newId();
        store.mediaAssets.push({
          id: mediaId,
          user_id: payload.userId,
          file_url: blob.url,
          file_name: payload.fileName,
          file_size: Number(payload.fileSize),
          type: payload.type,
          mime_type: payload.mimeType,
          created_at: new Date().toISOString()
        });
        await saveStore(store);
      }
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 400 }
    );
  }
}
