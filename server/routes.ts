import type { Express } from "express";
import { createServer, type Server } from "http";
import cookieParser from "cookie-parser";
import { storage } from "./storage";
import { hashPassword, verifyPassword, createSession, getSession, destroySession, requireAuth } from "./auth";
import { loginSchema, registerSchema } from "../shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(cookieParser());

  app.post("/api/auth/register", async (req, res) => {
    try {
      const validated = registerSchema.safeParse(req.body);
      if (!validated.success) {
        return res.status(400).json({ 
          error: validated.error.errors[0]?.message || "Invalid input" 
        });
      }

      const { email, password, first_name, last_name } = validated.data;

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "An account with this email already exists" });
      }

      const passwordHash = await hashPassword(password);

      const user = await storage.createUser({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        first_name,
        last_name,
        role: "client",
      });

      await createSession(user.id, res);

      const redirectTo = user.role === "client" ? "/dashboard/client" : "/dashboard/admin";

      return res.status(201).json({
        success: true,
        redirectTo,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ error: "An error occurred during registration" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const validated = loginSchema.safeParse(req.body);
      if (!validated.success) {
        return res.status(400).json({ error: "Invalid input" });
      }

      const { email, password } = validated.data;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const passwordValid = await verifyPassword(password, user.password_hash);
      if (!passwordValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      await createSession(user.id, res);

      const redirectTo = user.role === "client" ? "/dashboard/client" : "/dashboard/admin";

      return res.json({
        success: true,
        redirectTo,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ error: "An error occurred during sign in" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      await destroySession(req, res);
      return res.json({ success: true });
    } catch (error) {
      console.error("Logout error:", error);
      return res.status(500).json({ error: "An error occurred during sign out" });
    }
  });

  app.get("/api/auth/session", async (req, res) => {
    try {
      const session = await getSession(req);
      if (!session) {
        return res.json({ authenticated: false, user: null });
      }
      return res.json({
        authenticated: true,
        user: session.user,
      });
    } catch (error) {
      console.error("Session check error:", error);
      return res.json({ authenticated: false, user: null });
    }
  });

  app.get("/api/users/me", requireAuth(), async (req, res) => {
    const user = (req as any).user;
    return res.json(user);
  });

  return httpServer;
}
