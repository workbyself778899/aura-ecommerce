import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import imagekit from "@/lib/imagekit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const fileName = (formData.get("fileName") as string) || "upload";
    const folder = (formData.get("folder") as string) || "/products/general";
    const tags = (formData.get("tags") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert File to Buffer for server-side upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResponse = await imagekit.upload({
      file: buffer,
      fileName,
      folder,
      tags: tags ? tags.split(",") : ["product", "store-asset"],
      useUniqueFileName: true,
    });

    return NextResponse.json({
      fileId: uploadResponse.fileId,
      url: uploadResponse.url,
      thumbnailUrl: uploadResponse.thumbnailUrl,
      filePath: uploadResponse.filePath,
      name: uploadResponse.name,
    });
  } catch (error) {
    console.error("ImageKit server upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
