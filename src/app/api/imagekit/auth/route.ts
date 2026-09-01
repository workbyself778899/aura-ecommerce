import { NextResponse } from "next/server";
import { getAuthParams } from "@/lib/imagekit";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  // Only authenticated users (admin) can request upload credentials
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const authParams = getAuthParams();
    return NextResponse.json(authParams);
  } catch (error) {
    console.error("ImageKit auth error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload credentials" },
      { status: 500 }
    );
  }
}
