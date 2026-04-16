import path from "node:path";
import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

const allowedTypes = new Set(["image/png", "image/webp", "image/jpeg", "image/jpg"]);

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const formData = await request.formData();
    const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);
    if (!files.length) return NextResponse.json({ error: "No files uploaded." }, { status: 400 });
    if (files.length > 3) return NextResponse.json({ error: "Maximum 3 images." }, { status: 400 });

    const uploadDir = path.join(process.cwd(), "public", "uploads", "reviews");
    await fs.mkdir(uploadDir, { recursive: true });
    const sharp = (await import("sharp")).default;
    const uploaded: string[] = [];
    for (const file of files) {
      if (!allowedTypes.has(file.type)) {
        return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 400 });
      }
      const baseName = file.name
        .toLowerCase()
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 40);
      const fileName = `${baseName || "review"}-${randomUUID().slice(0, 8)}.webp`;
      const fullPath = path.join(uploadDir, fileName);
      const buffer = Buffer.from(await file.arrayBuffer());
      const optimized = await sharp(buffer)
        .rotate()
        .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82, effort: 4 })
        .toBuffer();
      await fs.writeFile(fullPath, optimized);
      uploaded.push(`/uploads/reviews/${fileName}`);
    }

    return NextResponse.json({ paths: uploaded });
  } catch (error) {
    console.error("Review upload failed", error);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}

