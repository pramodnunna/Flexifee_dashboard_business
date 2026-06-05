"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return { success: false, error: "Please fill in all fields." };
  }

  let role: "admin" | "ops" | null = null;

  if (email === "admin@flexifee.com" && password === "admin123") {
    role = "admin";
  } else if (email === "ops@flexifee.com" && password === "ops123") {
    role = "ops";
  }

  if (!role) {
    return { success: false, error: "Invalid email or password." };
  }

  const cookieStore = await cookies();
  cookieStore.set("auth_session", "flexifee_logged_in", {
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  cookieStore.set("role", role, {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  cookieStore.set("auth_email", email, {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  redirect("/");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_session");
  cookieStore.delete("role");
  cookieStore.delete("auth_email");
  
  redirect("/login");
}
