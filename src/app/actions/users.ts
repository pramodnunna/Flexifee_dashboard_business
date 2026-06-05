"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function createUser(formData: FormData) {
  const cookieStore = await cookies();
  const currentRole = cookieStore.get("role")?.value;
  
  if (currentRole !== "admin") {
    return { success: false, error: "Unauthorized. Only admins can create users." };
  }

  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();
  const role = formData.get("role")?.toString() || "ops";

  if (!name || !email || !password) {
    return { success: false, error: "Missing required fields." };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return { success: false, error: "User with this email already exists." };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role
      }
    });

    revalidatePath("/users");
    return { success: true };
  } catch (error) {
    console.error("Failed to create user", error);
    return { success: false, error: "Internal server error." };
  }
}

export async function changePassword(formData: FormData) {
  const cookieStore = await cookies();
  const email = cookieStore.get("auth_email")?.value;
  
  if (!email) {
    return { success: false, error: "Not logged in." };
  }

  const currentPassword = formData.get("currentPassword")?.toString();
  const newPassword = formData.get("newPassword")?.toString();

  if (!currentPassword || !newPassword) {
    return { success: false, error: "Missing required fields." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return { success: false, error: "User not found." };
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    
    if (!passwordMatch) {
      return { success: false, error: "Incorrect current password." };
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: { passwordHash: newPasswordHash }
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to change password", error);
    return { success: false, error: "Internal server error." };
  }
}
