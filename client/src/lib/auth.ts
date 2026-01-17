import type { SessionUser } from "@shared/schema";

export interface AuthState {
  authenticated: boolean;
  user: SessionUser | null;
  isLoading: boolean;
}

export async function getAuthSession(): Promise<{ authenticated: boolean; user: SessionUser | null }> {
  try {
    const response = await fetch("/api/auth/session", {
      credentials: "include",
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error checking auth session:", error);
    return { authenticated: false, user: null };
  }
}

export async function login(email: string, password: string): Promise<{ success: boolean; error?: string; redirectTo?: string; user?: SessionUser }> {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Login failed" };
    }
    return { success: true, redirectTo: data.redirectTo, user: data.user };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "An error occurred during sign in" };
  }
}

export async function register(data: {
  email: string;
  password: string;
  confirmPassword: string;
  first_name: string;
  last_name: string;
}): Promise<{ success: boolean; error?: string; redirectTo?: string; user?: SessionUser }> {
  try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) {
      return { success: false, error: result.error || "Registration failed" };
    }
    return { success: true, redirectTo: result.redirectTo, user: result.user };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, error: "An error occurred during registration" };
  }
}

export async function logout(): Promise<{ success: boolean }> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false };
  }
}
