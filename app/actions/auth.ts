"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, createSession, destroySession } from "@/lib/auth";
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";

type AuthResult = {
  success: boolean;
  error?: string;
  redirectTo?: string;
};

export async function login(data: LoginInput): Promise<AuthResult> {
  try {
    const validated = loginSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: "Invalid input" };
    }

    const { email, password } = validated.data;

    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return { success: false, error: "Invalid email or password" };
    }

    const passwordValid = await verifyPassword(password, user.password_hash);
    if (!passwordValid) {
      return { success: false, error: "Invalid email or password" };
    }

    await createSession(user.id);

    const redirectTo = user.role === "client" ? "/dashboard/client" : "/dashboard/admin";
    
    revalidatePath("/");
    return { success: true, redirectTo };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "An error occurred during sign in" };
  }
}

export async function registerUser(data: RegisterInput): Promise<AuthResult> {
  try {
    const validated = registerSchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0]?.message || "Invalid input" };
    }

    const { email, password, first_name, last_name } = validated.data;

    const existingUser = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return { success: false, error: "An account with this email already exists" };
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.users.create({
      data: {
        email: email.toLowerCase(),
        password_hash: passwordHash,
        first_name,
        last_name,
        role: "client",
      },
    });

    await createSession(user.id);

    revalidatePath("/");
    return { success: true, redirectTo: "/dashboard/client" };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, error: "An error occurred during registration" };
  }
}

export async function logout(): Promise<void> {
  await destroySession();
  revalidatePath("/");
}
