import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import cookieParser from "cookie-parser";
import multer from "multer";
import crypto from "crypto";
import { storage, fileStorage } from "./storage";
import { prisma } from "../lib/prisma";
import { hashPassword, verifyPassword, createSession, getSession, destroySession, requireAuth } from "./auth";
import { loginSchema, registerSchema, intakeStatusEnum, fileCategoryEnum } from "../shared/schema";
import type { SessionUser } from "../shared/schema";
import {
  logLogin,
  logLogout,
  logIntakeSubmission,
  logStatusChange,
  logPacketGeneration,
  logPreparerAssigned,
  logChecklistItemCreated,
  logChecklistItemResolved,
  logFileUpload,
  logFileDeleted,
  logFileDownload,
  logFileReviewToggled,
  createAuditLog,
  getClientInfo,
} from "./audit";
import { validateIntake, syncChecklistFromValidation } from "./validation";

const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_ID_SIZE = 10 * 1024 * 1024; // 10MB for IDs
const MAX_TAX_DOC_SIZE = 25 * 1024 * 1024; // 25MB for tax docs

const ID_CATEGORIES = ["photo_id_front", "photo_id_back", "spouse_photo_id_front", "spouse_photo_id_back"];
const TAX_DOC_CATEGORIES = ["w2", "1099_int", "1099_div", "1099_misc", "1099_nec", "1099_r", "1098", "other"];

function getMaxSizeForCategory(category: string): number {
  return ID_CATEGORIES.includes(category) ? MAX_ID_SIZE : MAX_TAX_DOC_SIZE;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_TAX_DOC_SIZE },
});

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
      session?: { user: SessionUser; token: string; expires_at: Date };
    }
  }
}

function isPreparerOrAdmin(role: string): boolean {
  return role === "preparer" || role === "admin";
}

async function canAccessIntake(userId: string, userRole: string, intakeId: string): Promise<boolean> {
  if (isPreparerOrAdmin(userRole)) {
    return true;
  }
  const intake = await prisma.intakes.findUnique({
    where: { id: intakeId },
    select: { user_id: true },
  });
  return intake?.user_id === userId;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(cookieParser());

  // Health check endpoint for debugging production issues
  app.get("/api/health", async (req, res) => {
    try {
      // Test database connection
      const result = await prisma.$queryRaw`SELECT 1 as ok`;
      const userCount = await prisma.users.count();
      return res.json({
        status: "healthy",
        database: "connected",
        userCount,
        env: {
          nodeEnv: process.env.NODE_ENV || "not set",
          hasPgHost: !!process.env.PGHOST,
          hasDatabaseUrl: !!process.env.DATABASE_URL,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        status: "unhealthy",
        database: "error",
        error: error.message || "Unknown error",
        env: {
          nodeEnv: process.env.NODE_ENV || "not set",
          hasPgHost: !!process.env.PGHOST,
          hasDatabaseUrl: !!process.env.DATABASE_URL,
        },
      });
    }
  });

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
      await logLogin(user.id, req);

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
      await logLogin(user.id, req);

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
      const session = await getSession(req);
      if (session) {
        await logLogout(session.user.id, req);
      }
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
    const user = req.user;
    return res.json(user);
  });

  app.get("/api/intakes", requireAuth(), async (req, res) => {
    try {
      const user = req.user!;
      let intakes;

      if (isPreparerOrAdmin(user.role)) {
        intakes = await prisma.intakes.findMany({
          include: {
            user: {
              select: { id: true, email: true, first_name: true, last_name: true },
            },
            assigned_preparer: {
              select: { id: true, email: true, first_name: true, last_name: true },
            },
          },
          orderBy: { created_at: "desc" },
        });
      } else {
        intakes = await prisma.intakes.findMany({
          where: { user_id: user.id },
          include: {
            assigned_preparer: {
              select: { id: true, email: true, first_name: true, last_name: true },
            },
          },
          orderBy: { created_at: "desc" },
        });
      }

      return res.json(intakes);
    } catch (error) {
      console.error("Error fetching intakes:", error);
      return res.status(500).json({ error: "Failed to fetch intakes" });
    }
  });

  app.get("/api/intakes/:id", requireAuth(), async (req, res) => {
    try {
      const user = req.user!;
      const intakeId = req.params.id;

      const hasAccess = await canAccessIntake(user.id, user.role, intakeId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const intake = await prisma.intakes.findUnique({
        where: { id: intakeId },
        include: {
          user: {
            select: { id: true, email: true, first_name: true, last_name: true },
          },
          assigned_preparer: {
            select: { id: true, email: true, first_name: true, last_name: true },
          },
          taxpayer_info: true,
          filing_status: true,
          photo_ids: true,
          bank_accounts: true,
          dependents: true,
          childcare_providers: true,
          estimated_payments: true,
          files: true,
          checklist_items: true,
          status_history: {
            orderBy: { created_at: "desc" },
          },
        },
      });

      if (!intake) {
        return res.status(404).json({ error: "Intake not found" });
      }

      return res.json(intake);
    } catch (error) {
      console.error("Error fetching intake:", error);
      return res.status(500).json({ error: "Failed to fetch intake" });
    }
  });

  app.post("/api/intakes", requireAuth(["client"]), async (req, res) => {
    try {
      const user = req.user!;
      const { tax_year } = req.body;

      const currentYear = new Date().getFullYear();
      const validYear = tax_year && Number.isInteger(tax_year) && tax_year >= 2020 && tax_year <= currentYear;

      const intake = await prisma.intakes.create({
        data: {
          user_id: user.id,
          tax_year: validYear ? tax_year : currentYear - 1,
          status: "draft",
        },
      });

      await prisma.status_history.create({
        data: {
          intake_id: intake.id,
          new_status: "draft",
          changed_by_id: user.id,
          notes: "Intake created",
        },
      });

      return res.status(201).json(intake);
    } catch (error) {
      console.error("Error creating intake:", error);
      return res.status(500).json({ error: "Failed to create intake" });
    }
  });

  app.get("/api/intakes/:id/validate", requireAuth(), async (req, res) => {
    try {
      const user = req.user!;
      const intakeId = req.params.id;

      const hasAccess = await canAccessIntake(user.id, user.role, intakeId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const validation = await validateIntake(intakeId);
      return res.json(validation);
    } catch (error) {
      console.error("Error validating intake:", error);
      return res.status(500).json({ error: "Failed to validate intake" });
    }
  });

  app.post("/api/intakes/:id/recalculate-checklist", requireAuth(["preparer", "admin"]), async (req, res) => {
    try {
      const user = req.user!;
      const intakeId = req.params.id;

      const intake = await prisma.intakes.findUnique({
        where: { id: intakeId },
      });

      if (!intake) {
        return res.status(404).json({ error: "Intake not found" });
      }

      await syncChecklistFromValidation(intakeId, user.id);
      const validation = await validateIntake(intakeId);

      return res.json({ success: true, validation });
    } catch (error) {
      console.error("Error recalculating checklist:", error);
      return res.status(500).json({ error: "Failed to recalculate checklist" });
    }
  });

  app.post("/api/intakes/:id/submit", requireAuth(["client"]), async (req, res) => {
    try {
      const user = req.user!;
      const intakeId = req.params.id;

      const intake = await prisma.intakes.findUnique({
        where: { id: intakeId },
        select: { user_id: true, status: true },
      });

      if (!intake) {
        return res.status(404).json({ error: "Intake not found" });
      }

      if (intake.user_id !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (intake.status !== "draft") {
        return res.status(400).json({ error: "Only draft intakes can be submitted" });
      }

      const validation = await validateIntake(intakeId);
      if (!validation.valid) {
        return res.status(400).json({ 
          error: "Intake has missing required fields or documents",
          validation
        });
      }

      const oldStatus = intake.status;
      const newStatus = "submitted";

      await prisma.intakes.update({
        where: { id: intakeId },
        data: { 
          status: newStatus, 
          submitted_at: new Date(),
          updated_at: new Date() 
        },
      });

      await prisma.status_history.create({
        data: {
          intake_id: intakeId,
          old_status: oldStatus,
          new_status: newStatus,
          changed_by_id: user.id,
          notes: "Client submitted intake",
        },
      });

      await logIntakeSubmission(user.id, intakeId, req);

      return res.json({ success: true, status: newStatus });
    } catch (error) {
      console.error("Error submitting intake:", error);
      return res.status(500).json({ error: "Failed to submit intake" });
    }
  });

  app.patch("/api/intakes/:id/status", requireAuth(["preparer", "admin"]), async (req, res) => {
    try {
      const user = req.user!;
      const intakeId = req.params.id;
      const { status, notes } = req.body;

      if (!status || !intakeStatusEnum.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const intake = await prisma.intakes.findUnique({
        where: { id: intakeId },
        select: { status: true },
      });

      if (!intake) {
        return res.status(404).json({ error: "Intake not found" });
      }

      const oldStatus = intake.status;

      await prisma.intakes.update({
        where: { id: intakeId },
        data: { status, updated_at: new Date() },
      });

      await prisma.status_history.create({
        data: {
          intake_id: intakeId,
          old_status: oldStatus,
          new_status: status,
          changed_by_id: user.id,
          notes: notes || null,
        },
      });

      await logStatusChange(user.id, intakeId, oldStatus, status, req);

      return res.json({ success: true, old_status: oldStatus, new_status: status });
    } catch (error) {
      console.error("Error updating intake status:", error);
      return res.status(500).json({ error: "Failed to update status" });
    }
  });

  app.patch("/api/intakes/:id/assign", requireAuth(["preparer", "admin"]), async (req, res) => {
    try {
      const user = req.user!;
      const intakeId = req.params.id;
      const { preparer_id } = req.body;

      if (!preparer_id) {
        return res.status(400).json({ error: "Preparer ID is required" });
      }

      const preparer = await prisma.users.findUnique({
        where: { id: preparer_id },
        select: { id: true, role: true },
      });

      if (!preparer || !isPreparerOrAdmin(preparer.role)) {
        return res.status(400).json({ error: "Invalid preparer" });
      }

      const intake = await prisma.intakes.findUnique({
        where: { id: intakeId },
      });

      if (!intake) {
        return res.status(404).json({ error: "Intake not found" });
      }

      await prisma.intakes.update({
        where: { id: intakeId },
        data: { assigned_preparer_id: preparer_id, updated_at: new Date() },
      });

      await logPreparerAssigned(user.id, intakeId, preparer_id, req);

      return res.json({ success: true, assigned_preparer_id: preparer_id });
    } catch (error) {
      console.error("Error assigning preparer:", error);
      return res.status(500).json({ error: "Failed to assign preparer" });
    }
  });

  // --- DEPENDENTS ---
  app.post("/api/intakes/:id/dependents", requireAuth(["client"]), async (req, res) => {
    try {
      const user = req.user!;
      const intakeId = req.params.id;
      const { 
        first_name, last_name, ssn, relationship, 
        months_lived_with, dob, is_student, is_disabled, 
        provides_over_half_support, has_ip_pin, ip_pin
      } = req.body;

      const intake = await prisma.intakes.findUnique({ where: { id: intakeId } });
      if (!intake || intake.user_id !== user.id) return res.status(403).json({ error: "Access denied" });

      const { encryptToBytea } = await import("../lib/crypto");
      
      const dependent = await prisma.dependents.create({
        data: {
          intake_id: intakeId,
          first_name,
          last_name,
          ssn_encrypted: ssn ? encryptToBytea(ssn) : null,
          relationship,
          months_lived_with: months_lived_with ? parseInt(months_lived_with) : null,
          dob: dob ? new Date(dob) : null,
          is_student: !!is_student,
          is_disabled: !!is_disabled,
          provides_over_half_support: !!provides_over_half_support,
        }
      });

      return res.status(201).json(dependent);
    } catch (error) {
      console.error("Error creating dependent:", error);
      return res.status(500).json({ error: "Failed to create dependent" });
    }
  });

  app.delete("/api/dependents/:id", requireAuth(["client"]), async (req, res) => {
    try {
      const user = req.user!;
      const dependentId = req.params.id;

      const dependent = await prisma.dependents.findUnique({
        where: { id: dependentId },
        include: { intake: true }
      });

      if (!dependent || dependent.intake.user_id !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      await prisma.dependents.delete({ where: { id: dependentId } });
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting dependent:", error);
      return res.status(500).json({ error: "Failed to delete dependent" });
    }
  });

  // --- CHILDCARE PROVIDERS ---
  app.post("/api/intakes/:id/childcare", requireAuth(["client"]), async (req, res) => {
    try {
      const user = req.user!;
      const intakeId = req.params.id;
      const { provider_name, provider_address, provider_city, provider_state, provider_zip, provider_ein, amount_paid } = req.body;

      const intake = await prisma.intakes.findUnique({ where: { id: intakeId } });
      if (!intake || intake.user_id !== user.id) return res.status(403).json({ error: "Access denied" });

      const { encryptToBytea } = await import("../lib/crypto");

      const provider = await prisma.childcare_providers.create({
        data: {
          intake_id: intakeId,
          provider_name,
          provider_address,
          provider_city,
          provider_state,
          provider_zip,
          provider_ein_encrypted: provider_ein ? encryptToBytea(provider_ein) : null,
          amount_paid: amount_paid ? parseFloat(amount_paid) : null,
        }
      });

      return res.status(201).json(provider);
    } catch (error) {
      console.error("Error creating childcare provider:", error);
      return res.status(500).json({ error: "Failed to create childcare provider" });
    }
  });

  app.delete("/api/childcare/:id", requireAuth(["client"]), async (req, res) => {
    try {
      const user = req.user!;
      const providerId = req.params.id;

      const provider = await prisma.childcare_providers.findUnique({
        where: { id: providerId },
        include: { intake: true }
      });

      if (!provider || provider.intake.user_id !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      await prisma.childcare_providers.delete({ where: { id: providerId } });
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting childcare provider:", error);
      return res.status(500).json({ error: "Failed to delete childcare provider" });
    }
  });

  // --- ESTIMATED PAYMENTS ---
  app.post("/api/intakes/:id/estimated-payments", requireAuth(["client"]), async (req, res) => {
    try {
      const user = req.user!;
      const intakeId = req.params.id;
      const { tax_authority, payment_period, amount, date_paid } = req.body;

      const intake = await prisma.intakes.findUnique({ where: { id: intakeId } });
      if (!intake || intake.user_id !== user.id) return res.status(403).json({ error: "Access denied" });

      const payment = await prisma.estimated_payments.create({
        data: {
          intake_id: intakeId,
          tax_authority,
          payment_period,
          amount: parseFloat(amount),
          date_paid: date_paid ? new Date(date_paid) : null,
        }
      });

      return res.status(201).json(payment);
    } catch (error) {
      console.error("Error creating estimated payment:", error);
      return res.status(500).json({ error: "Failed to create estimated payment" });
    }
  });

  app.delete("/api/estimated-payments/:id", requireAuth(["client"]), async (req, res) => {
    try {
      const user = req.user!;
      const paymentId = req.params.id;

      const payment = await prisma.estimated_payments.findUnique({
        where: { id: paymentId },
        include: { intake: true }
      });

      if (!payment || payment.intake.user_id !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      await prisma.estimated_payments.delete({ where: { id: paymentId } });
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting estimated payment:", error);
      return res.status(500).json({ error: "Failed to delete estimated payment" });
    }
  });

  app.get("/api/intakes/:id/files", requireAuth(), async (req, res) => {
    try {
      const user = req.user!;
      const intakeId = req.params.id;

      const hasAccess = await canAccessIntake(user.id, user.role, intakeId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const files = await prisma.files.findMany({
        where: { intake_id: intakeId },
        orderBy: { created_at: "desc" },
      });

      return res.json(files);
    } catch (error) {
      console.error("Error fetching files:", error);
      return res.status(500).json({ error: "Failed to fetch files" });
    }
  });

  app.post("/api/intakes/:id/files", requireAuth(), upload.single("file"), async (req: any, res) => {
    try {
      const user = req.user!;
      const intakeId = req.params.id;
      const { category } = req.body;

      const intake = await prisma.intakes.findUnique({
        where: { id: intakeId },
        select: { user_id: true, status: true },
      });

      if (!intake) {
        return res.status(404).json({ error: "Intake not found" });
      }

      if (user.role === "client" && intake.user_id !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
        return res.status(400).json({ error: "File type not allowed. Only PDF, JPEG, and PNG files are accepted." });
      }

      const validCategory = fileCategoryEnum.includes(category) ? category : "other";
      const maxSize = getMaxSizeForCategory(validCategory);

      if (req.file.size > maxSize) {
        const maxMB = Math.round(maxSize / (1024 * 1024));
        return res.status(400).json({ error: `File too large. Maximum size is ${maxMB}MB for this document type.` });
      }

      const checksum = crypto.createHash("sha256").update(req.file.buffer).digest("hex");

      const { storedFilename, storageKey } = await (fileStorage as any).uploadToIntake(
        req.file.buffer,
        req.file.originalname,
        intakeId
      );

      const fileRecord = await prisma.files.create({
        data: {
          intake_id: intakeId,
          file_category: validCategory,
          original_filename: req.file.originalname,
          stored_filename: storedFilename,
          storage_key: storageKey,
          mime_type: req.file.mimetype,
          file_size: req.file.size,
          checksum: checksum,
          uploaded_by_id: user.id,
          is_reviewed: false,
        },
      });

      await logFileUpload(user.id, intakeId, fileRecord.id, req.file.originalname, req);

      return res.status(201).json(fileRecord);
    } catch (error) {
      console.error("Error uploading file:", error);
      return res.status(500).json({ error: "Failed to upload file" });
    }
  });

  app.get("/api/files/:fileId/download", requireAuth(), async (req, res) => {
    try {
      const user = req.user!;
      const fileId = req.params.fileId;

      const file = await prisma.files.findUnique({
        where: { id: fileId },
        include: { intake: { select: { user_id: true } } },
      });

      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      const hasAccess = await canAccessIntake(user.id, user.role, file.intake_id);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const exists = await (fileStorage as any).existsByKey(file.storage_key);
      if (!exists) {
        return res.status(404).json({ error: "File not found on storage" });
      }

      const buffer = await (fileStorage as any).downloadByKey(file.storage_key);

      await logFileDownload(user.id, file.intake_id, fileId, file.original_filename, req);

      res.setHeader("Content-Type", file.mime_type);
      res.setHeader("Content-Disposition", `attachment; filename="${file.original_filename}"`);
      res.setHeader("Content-Length", buffer.length);

      return res.send(buffer);
    } catch (error) {
      console.error("Error downloading file:", error);
      return res.status(500).json({ error: "Failed to download file" });
    }
  });

  app.patch("/api/files/:fileId/review", requireAuth(["preparer", "admin"]), async (req, res) => {
    try {
      const user = req.user!;
      const fileId = req.params.fileId;
      const { is_reviewed } = req.body;

      if (typeof is_reviewed !== "boolean") {
        return res.status(400).json({ error: "is_reviewed must be a boolean" });
      }

      const file = await prisma.files.findUnique({
        where: { id: fileId },
        select: { id: true, intake_id: true },
      });

      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      const updatedFile = await prisma.files.update({
        where: { id: fileId },
        data: { is_reviewed },
      });

      await logFileReviewToggled(user.id, file.intake_id, fileId, is_reviewed, req);

      return res.json(updatedFile);
    } catch (error) {
      console.error("Error toggling file review:", error);
      return res.status(500).json({ error: "Failed to update file review status" });
    }
  });

  app.delete("/api/files/:fileId", requireAuth(), async (req, res) => {
    try {
      const user = req.user!;
      const fileId = req.params.fileId;

      const file = await prisma.files.findUnique({
        where: { id: fileId },
        include: { intake: { select: { user_id: true, status: true } } },
      });

      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      if (user.role === "client") {
        if (file.intake.user_id !== user.id) {
          return res.status(403).json({ error: "Access denied" });
        }
        if (file.intake.status !== "draft") {
          return res.status(400).json({ error: "Cannot delete files from submitted intakes" });
        }
      }

      await (fileStorage as any).deleteByKey(file.storage_key);

      await prisma.files.delete({
        where: { id: fileId },
      });

      await logFileDeleted(user.id, file.intake_id, fileId, file.original_filename, req);

      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting file:", error);
      return res.status(500).json({ error: "Failed to delete file" });
    }
  });

  app.get("/api/intakes/:id/checklist", requireAuth(), async (req, res) => {
    try {
      const user = req.user!;
      const intakeId = req.params.id;

      const hasAccess = await canAccessIntake(user.id, user.role, intakeId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const items = await prisma.checklist_items.findMany({
        where: { intake_id: intakeId },
        orderBy: { created_at: "desc" },
      });

      return res.json(items);
    } catch (error) {
      console.error("Error fetching checklist:", error);
      return res.status(500).json({ error: "Failed to fetch checklist" });
    }
  });

  app.post("/api/intakes/:id/checklist", requireAuth(["preparer", "admin"]), async (req, res) => {
    try {
      const user = req.user!;
      const intakeId = req.params.id;
      const { item_type, field_name, description } = req.body;

      if (!item_type || !description) {
        return res.status(400).json({ error: "Item type and description are required" });
      }

      const intake = await prisma.intakes.findUnique({
        where: { id: intakeId },
      });

      if (!intake) {
        return res.status(404).json({ error: "Intake not found" });
      }

      const item = await prisma.checklist_items.create({
        data: {
          intake_id: intakeId,
          item_type,
          field_name: field_name || null,
          description,
          is_resolved: false,
          created_by_user_id: user.id,
        },
      });

      await logChecklistItemCreated(user.id, intakeId, item.id, description, req);

      return res.status(201).json(item);
    } catch (error) {
      console.error("Error creating checklist item:", error);
      return res.status(500).json({ error: "Failed to create checklist item" });
    }
  });

  app.patch("/api/checklist/:itemId/resolve", requireAuth(["preparer", "admin"]), async (req, res) => {
    try {
      const user = req.user!;
      const itemId = req.params.itemId;

      const item = await prisma.checklist_items.findUnique({
        where: { id: itemId },
        include: { intake: { select: { user_id: true } } },
      });

      if (!item) {
        return res.status(404).json({ error: "Checklist item not found" });
      }

      await prisma.checklist_items.update({
        where: { id: itemId },
        data: { 
          is_resolved: true, 
          resolved_at: new Date(), 
          resolved_by_user_id: user.id,
          updated_at: new Date() 
        },
      });

      await logChecklistItemResolved(user.id, item.intake_id, itemId, req);

      return res.json({ success: true });
    } catch (error) {
      console.error("Error resolving checklist item:", error);
      return res.status(500).json({ error: "Failed to resolve checklist item" });
    }
  });

  app.delete("/api/checklist/:itemId", requireAuth(["preparer", "admin"]), async (req, res) => {
    try {
      const user = req.user!;
      const itemId = req.params.itemId;

      const item = await prisma.checklist_items.findUnique({
        where: { id: itemId },
      });

      if (!item) {
        return res.status(404).json({ error: "Checklist item not found" });
      }

      await prisma.checklist_items.delete({
        where: { id: itemId },
      });

      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting checklist item:", error);
      return res.status(500).json({ error: "Failed to delete checklist item" });
    }
  });

  app.post("/api/intakes/:id/packet", requireAuth(["preparer", "admin"]), async (req, res) => {
    try {
      const user = req.user!;
      const intakeId = req.params.id;

      const intake = await prisma.intakes.findUnique({
        where: { id: intakeId },
      });

      if (!intake) {
        return res.status(404).json({ error: "Intake not found" });
      }

      const packetRequest = await prisma.preparer_packet_requests.create({
        data: {
          intake_id: intakeId,
          requested_by_id: user.id,
          status: "pending",
        },
      });

      await logPacketGeneration(user.id, intakeId, req, { request_id: packetRequest.id });

      const { processPacketRequest } = await import("./packet");
      processPacketRequest(packetRequest.id).catch(err => {
        console.error("Background packet generation failed:", err);
      });

      return res.status(201).json({ 
        success: true, 
        request_id: packetRequest.id,
        status: "pending",
        message: "Packet generation request created" 
      });
    } catch (error) {
      console.error("Error requesting packet:", error);
      return res.status(500).json({ error: "Failed to request packet" });
    }
  });

  app.get("/api/intakes/:id/packet-requests", requireAuth(["preparer", "admin"]), async (req, res) => {
    try {
      const intakeId = req.params.id;

      const requests = await prisma.preparer_packet_requests.findMany({
        where: { intake_id: intakeId },
        orderBy: { created_at: "desc" },
        include: {
          requested_by: {
            select: { id: true, email: true, first_name: true, last_name: true },
          },
        },
      });

      return res.json(requests);
    } catch (error) {
      console.error("Error fetching packet requests:", error);
      return res.status(500).json({ error: "Failed to fetch packet requests" });
    }
  });

  app.get("/api/packet-requests/:requestId", requireAuth(["preparer", "admin"]), async (req, res) => {
    try {
      const requestId = req.params.requestId;

      const request = await prisma.preparer_packet_requests.findUnique({
        where: { id: requestId },
        include: {
          requested_by: {
            select: { id: true, email: true, first_name: true, last_name: true },
          },
        },
      });

      if (!request) {
        return res.status(404).json({ error: "Packet request not found" });
      }

      return res.json(request);
    } catch (error) {
      console.error("Error fetching packet request:", error);
      return res.status(500).json({ error: "Failed to fetch packet request" });
    }
  });

  app.get("/api/packet-requests/:requestId/download/:filename", requireAuth(["preparer", "admin"]), async (req, res) => {
    try {
      const user = req.user!;
      const { requestId, filename } = req.params;

      if (filename !== "Summary.pdf" && filename !== "Packet.zip") {
        return res.status(400).json({ error: "Invalid filename" });
      }

      const request = await prisma.preparer_packet_requests.findUnique({
        where: { id: requestId },
      });

      if (!request) {
        return res.status(404).json({ error: "Packet request not found" });
      }

      if (request.status !== "completed" || !request.packet_url) {
        return res.status(400).json({ error: "Packet is not ready for download" });
      }

      const { getPacketPath } = await import("./packet");
      const filePath = getPacketPath(request.packet_url, filename as "Summary.pdf" | "Packet.zip");

      const fs = await import("fs");
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found" });
      }

      await createAuditLog({
        user_id: user.id,
        action: "packet_generated",
        resource: "intake",
        resource_id: request.intake_id,
        details: { request_id: requestId, download: filename },
        ...getClientInfo(req),
      });

      res.download(filePath, filename);
    } catch (error) {
      console.error("Error downloading packet file:", error);
      return res.status(500).json({ error: "Failed to download file" });
    }
  });

  app.get("/api/preparers", requireAuth(["preparer", "admin"]), async (req, res) => {
    try {
      const preparers = await prisma.users.findMany({
        where: {
          role: { in: ["preparer", "admin"] },
        },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          role: true,
        },
        orderBy: { first_name: "asc" },
      });

      return res.json(preparers);
    } catch (error) {
      console.error("Error fetching preparers:", error);
      return res.status(500).json({ error: "Failed to fetch preparers" });
    }
  });

  app.get("/api/admin/clients", requireAuth(["preparer", "admin"]), async (req, res) => {
    try {
      const clients = await prisma.users.findMany({
        where: { role: "client" },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          created_at: true,
          intakes: {
            select: { id: true, tax_year: true, status: true },
            orderBy: { tax_year: "desc" },
          },
        },
        orderBy: { created_at: "desc" },
      });

      return res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      return res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.get("/api/admin/stats", requireAuth(["preparer", "admin"]), async (req, res) => {
    try {
      const [
        totalClients,
        totalIntakes,
        draftIntakes,
        submittedIntakes,
        inReviewIntakes,
        filedIntakes,
      ] = await Promise.all([
        prisma.users.count({ where: { role: "client" } }),
        prisma.intakes.count(),
        prisma.intakes.count({ where: { status: "draft" } }),
        prisma.intakes.count({ where: { status: "submitted" } }),
        prisma.intakes.count({ where: { status: "in_review" } }),
        prisma.intakes.count({ where: { status: "filed" } }),
      ]);

      return res.json({
        total_clients: totalClients,
        total_intakes: totalIntakes,
        draft_intakes: draftIntakes,
        submitted_intakes: submittedIntakes,
        in_review_intakes: inReviewIntakes,
        filed_intakes: filedIntakes,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      return res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.patch("/api/intakes/:id/filing-status", requireAuth(["client"]), async (req, res) => {
    try {
      const user = req.user!;
      const intakeId = req.params.id;
      const { filing_status, spouse_itemizes_separately, can_be_claimed_as_dependent, spouse_can_be_claimed } = req.body;

      const intake = await prisma.intakes.findUnique({
        where: { id: intakeId },
        select: { user_id: true, status: true },
      });

      if (!intake || intake.user_id !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (intake.status !== "draft") {
        return res.status(400).json({ error: "Cannot modify submitted intake" });
      }

      console.log(`[DEBUG] Updating filing status for intake ${intakeId}:`, filing_status);

      await prisma.filing_status.upsert({
        where: { intake_id: intakeId },
        create: {
          intake_id: intakeId,
          filing_status,
          spouse_itemizes_separately,
          can_be_claimed_as_dependent,
          spouse_can_be_claimed,
        },
        update: {
          filing_status,
          spouse_itemizes_separately,
          can_be_claimed_as_dependent,
          spouse_can_be_claimed,
          updated_at: new Date(),
        },
      });

      // Automatically sync checklist after update
      const { syncChecklistFromValidation } = await import("./validation");
      await syncChecklistFromValidation(intakeId, user.id);

      return res.json({ success: true });
    } catch (error) {
      console.error("Error updating filing status:", error);
      return res.status(500).json({ error: "Failed to update filing status" });
    }
  });

  app.get("/api/intakes/:id/taxpayer-info", requireAuth(), async (req, res) => {
    try {
      const user = req.user!;
      const intakeId = req.params.id;

      const hasAccess = await canAccessIntake(user.id, user.role, intakeId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const taxpayerInfo = await prisma.taxpayer_info.findUnique({
        where: { intake_id: intakeId },
      });

      if (!taxpayerInfo) {
        return res.json(null);
      }

      const result = {
        ...taxpayerInfo,
        taxpayer_ssn_encrypted: undefined,
        taxpayer_ip_pin_encrypted: undefined,
        spouse_ssn_encrypted: undefined,
        spouse_ip_pin_encrypted: undefined,
        taxpayer_ssn_last4: taxpayerInfo.taxpayer_ssn_encrypted ? "****" : null,
        spouse_ssn_last4: taxpayerInfo.spouse_ssn_encrypted ? "****" : null,
        has_taxpayer_ip_pin: !!taxpayerInfo.taxpayer_ip_pin_encrypted,
        has_spouse_ip_pin: !!taxpayerInfo.spouse_ip_pin_encrypted,
      };

      return res.json(result);
    } catch (error) {
      console.error("Error fetching taxpayer info:", error);
      return res.status(500).json({ error: "Failed to fetch taxpayer info" });
    }
  });

  app.patch("/api/intakes/:id/taxpayer-info", requireAuth(["client"]), async (req, res) => {
    try {
      const user = req.user!;
      const intakeId = req.params.id;

      const intake = await prisma.intakes.findUnique({
        where: { id: intakeId },
        select: { user_id: true, status: true },
      });

      if (!intake) {
        return res.status(404).json({ error: "Intake not found" });
      }

      if (intake.user_id !== user.id) {
        return res.status(403).json({ error: "Access denied" });
      }

      if (intake.status !== "draft") {
        return res.status(400).json({ error: "Cannot modify submitted intake" });
      }

      const {
        taxpayer_first_name,
        taxpayer_middle_initial,
        taxpayer_last_name,
        taxpayer_dob,
        taxpayer_ssn,
        taxpayer_ip_pin,
        taxpayer_occupation,
        taxpayer_phone,
        taxpayer_email,
        spouse_first_name,
        spouse_middle_initial,
        spouse_last_name,
        spouse_dob,
        spouse_ssn,
        spouse_ip_pin,
        spouse_occupation,
        spouse_phone,
        spouse_email,
        address_street,
        address_apt,
        address_city,
        address_state,
        address_zip,
        resident_state,
        resident_city,
        school_district,
        county,
        appointment_scheduled_for,
      } = req.body;

      const { encryptToBytea } = await import("../lib/crypto");

      const updateData: any = {};

      if (taxpayer_first_name !== undefined) updateData.taxpayer_first_name = taxpayer_first_name || null;
      if (taxpayer_middle_initial !== undefined) updateData.taxpayer_middle_initial = taxpayer_middle_initial || null;
      if (taxpayer_last_name !== undefined) updateData.taxpayer_last_name = taxpayer_last_name || null;
      if (taxpayer_dob !== undefined) updateData.taxpayer_dob = taxpayer_dob ? new Date(taxpayer_dob) : null;
      if (taxpayer_occupation !== undefined) updateData.taxpayer_occupation = taxpayer_occupation || null;
      if (taxpayer_phone !== undefined) updateData.taxpayer_phone = taxpayer_phone || null;
      if (taxpayer_email !== undefined) updateData.taxpayer_email = taxpayer_email || null;

      if (taxpayer_ssn !== undefined && taxpayer_ssn) {
        updateData.taxpayer_ssn_encrypted = encryptToBytea(taxpayer_ssn);
      }
      if (taxpayer_ip_pin !== undefined && taxpayer_ip_pin) {
        updateData.taxpayer_ip_pin_encrypted = encryptToBytea(taxpayer_ip_pin);
      }

      if (spouse_first_name !== undefined) updateData.spouse_first_name = spouse_first_name || null;
      if (spouse_middle_initial !== undefined) updateData.spouse_middle_initial = spouse_middle_initial || null;
      if (spouse_last_name !== undefined) updateData.spouse_last_name = spouse_last_name || null;
      if (spouse_dob !== undefined) updateData.spouse_dob = spouse_dob ? new Date(spouse_dob) : null;
      if (spouse_occupation !== undefined) updateData.spouse_occupation = spouse_occupation || null;
      if (spouse_phone !== undefined) updateData.spouse_phone = spouse_phone || null;
      if (spouse_email !== undefined) updateData.spouse_email = spouse_email || null;

      if (spouse_ssn !== undefined && spouse_ssn) {
        updateData.spouse_ssn_encrypted = encryptToBytea(spouse_ssn);
      }
      if (spouse_ip_pin !== undefined && spouse_ip_pin) {
        updateData.spouse_ip_pin_encrypted = encryptToBytea(spouse_ip_pin);
      }

      if (address_street !== undefined) updateData.address_street = address_street || null;
      if (address_apt !== undefined) updateData.address_apt = address_apt || null;
      if (address_city !== undefined) updateData.address_city = address_city || null;
      if (address_state !== undefined) updateData.address_state = address_state || null;
      if (address_zip !== undefined) updateData.address_zip = address_zip || null;

      if (resident_state !== undefined) updateData.resident_state = resident_state || null;
      if (resident_city !== undefined) updateData.resident_city = resident_city || null;
      if (school_district !== undefined) updateData.school_district = school_district || null;
      if (county !== undefined) updateData.county = county || null;
      if (appointment_scheduled_for !== undefined) updateData.appointment_scheduled_for = appointment_scheduled_for || null;

      console.log(`[DEBUG] Updating canonical TPINFO for intake ${intakeId}:`, Object.keys(updateData));

      const existingInfo = await prisma.taxpayer_info.findUnique({
        where: { intake_id: intakeId },
      });

      let taxpayerInfo;
      if (existingInfo) {
        taxpayerInfo = await prisma.taxpayer_info.update({
          where: { intake_id: intakeId },
          data: updateData,
        });
      } else {
        taxpayerInfo = await prisma.taxpayer_info.create({
          data: {
            intake_id: intakeId,
            ...updateData,
          },
        });
      }

      // Automatically sync checklist after update
      const { syncChecklistFromValidation } = await import("./validation");
      await syncChecklistFromValidation(intakeId, user.id);

      const result = {
        ...taxpayerInfo,
        taxpayer_ssn_encrypted: undefined,
        taxpayer_ip_pin_encrypted: undefined,
        spouse_ssn_encrypted: undefined,
        spouse_ip_pin_encrypted: undefined,
      };

      return res.json({ success: true, data: result });
    } catch (error) {
      console.error("Error updating taxpayer info:", error);
      return res.status(500).json({ error: "Failed to update taxpayer info" });
    }
  });

  return httpServer;
}
