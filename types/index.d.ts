export interface MediaAsset {
  id: string;
  userId: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  type: "image" | "video";
  mimeType: string;
  durationMs?: number;
  createdAt: string;
}
