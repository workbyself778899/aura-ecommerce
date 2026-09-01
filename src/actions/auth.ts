"use server";

import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
}): Promise<{ success: boolean; error?: string }> {
  await connectDB();

  try {
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      return { success: false, error: "An account with this email already exists." };
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    await User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
      role: "CUSTOMER",
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Registration failed",
    };
  }
}
