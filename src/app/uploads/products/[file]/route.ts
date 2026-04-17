import path from "node:path";
import { promises as fs } from "node:fs";
import { NextResponse } from "next/server";
import { getLegacyUploadDirectory, getUploadDirectory } from "@/lib/uploads-path";

const MIME_BY_EXT: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
};

function sanitizeFilename(input: string) {
  return path.basename(input).replace(/[^a-zA-Z0-9._-]/g, "");
}

export async function GET(
  _request: Request,
  { params }: { params: { file: string } }
) {
  const file = sanitizeFilename(params.file);
  if (!file) {
    return new NextResponse("Invalid file.", { status: 400 });
  }

  try {
    const primaryPath = path.join(getUploadDirectory("products"), file);
    const fallbackPath = path.join(getLegacyUploadDirectory("products"), file);
    let data: Buffer;
    try {
      data = await fs.readFile(primaryPath);
    } catch {
      data = await fs.readFile(fallbackPath);
    }
    const ext = path.extname(file).toLowerCase();
    const contentType = MIME_BY_EXT[ext] ?? "application/octet-stream";
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found.", { status: 404 });
  }
}

