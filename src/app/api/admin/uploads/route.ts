import path from "node:path";
import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getUploadDirectory } from "@/lib/uploads-path";

const allowedTypes = new Set(["image/png", "image/webp", "image/jpeg", "image/jpg"]);

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const formData = await request.formData();
    const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);

    if (!files.length) {
      return NextResponse.json({ error: "No files uploaded." }, { status: 400 });
    }

    const uploadDir = getUploadDirectory("products");
    await fs.mkdir(uploadDir, { recursive: true });

    const uploaded: string[] = [];
    const sharpModule = await import("sharp");
    const sharp = sharpModule.default;

    for (const file of files) {
      if (!allowedTypes.has(file.type)) {
        return NextResponse.json(
          { error: `Unsupported file type: ${file.type}` },
          { status: 400 }
        );
      }

      const baseName = file.name
        .toLowerCase()
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 40);
      const fileName = `${baseName || "product"}-${randomUUID().slice(0, 8)}.webp`;
      const fullPath = path.join(uploadDir, fileName);

      const buffer = Buffer.from(await file.arrayBuffer());
      const optimized = await sharp(buffer)
        .rotate()
        .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 92, effort: 5, smartSubsample: true })
        .toBuffer();
      await fs.writeFile(fullPath, optimized);
      uploaded.push(`/uploads/products/${fileName}`);
    }

    return NextResponse.json({ paths: uploaded });
  } catch (error) {
    console.error("Upload failed", error);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
