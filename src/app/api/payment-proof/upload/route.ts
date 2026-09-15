import { NextResponse } from "next/server";
import imagekit from "@/lib/imagekit";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const notes = (formData.get("notes") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const originalName = file.name || `proof-${Date.now()}`;
    const fileType = file.type || "application/octet-stream";

    let fileUrl = "";

    // 1. Try ImageKit upload if keys are present
    const hasImageKit =
      process.env.IMAGEKIT_PUBLIC_KEY &&
      !process.env.IMAGEKIT_PUBLIC_KEY.includes("dummy") &&
      !process.env.IMAGEKIT_PUBLIC_KEY.includes("xxxxxxxx");

    if (hasImageKit) {
      try {
        const uploadRes = await imagekit.upload({
          file: buffer,
          fileName: `proof-${Date.now()}-${originalName.replace(/\s+/g, "_")}`,
          folder: "/payment-proofs/",
          tags: ["payment-proof", "customer-receipt"],
          useUniqueFileName: true,
        });
        fileUrl = uploadRes.url;
      } catch (ikError) {
        console.warn("ImageKit proof upload failed, falling back to local storage:", ikError);
      }
    }

    // 2. Fallback to local public uploads if ImageKit failed or is unconfigured
    if (!fileUrl) {
      const uploadsDir = path.join(process.cwd(), "public", "uploads", "proofs");
      await fs.mkdir(uploadsDir, { recursive: true });

      const safeExt = path.extname(originalName) || (fileType.includes("pdf") ? ".pdf" : ".jpg");
      const safeFileName = `proof-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${safeExt}`;
      const filePath = path.join(uploadsDir, safeFileName);

      await fs.writeFile(filePath, buffer);
      fileUrl = `/uploads/proofs/${safeFileName}`;
    }

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName: originalName,
      fileType,
      notes,
    });
  } catch (error) {
    console.error("Payment proof upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload proof" },
      { status: 500 }
    );
  }
}
