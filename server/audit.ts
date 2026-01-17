import { prisma } from "../lib/prisma";
import type { AuditResult } from "../shared/schema";

export type AuditAction = 
  | "login"
  | "logout"
  | "intake_submitted"
  | "status_changed"
  | "packet_generated"
  | "file_uploaded"
  | "file_deleted"
  | "preparer_assigned"
  | "checklist_item_created"
  | "checklist_item_resolved";

export interface AuditLogEntry {
  user_id: string | null;
  action: AuditAction;
  resource: string;
  resource_id?: string | null;
  result?: AuditResult;
  details?: Record<string, any>;
  ip_address?: string | null;
  user_agent?: string | null;
}

export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.audit_logs.create({
      data: {
        user_id: entry.user_id,
        action: entry.action,
        resource: entry.resource,
        resource_id: entry.resource_id || null,
        result: entry.result || "success",
        details: entry.details || null,
        ip_address: entry.ip_address || null,
        user_agent: entry.user_agent || null,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}

export function getClientInfo(req: any): { ip_address: string | null; user_agent: string | null } {
  const ip_address = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() 
    || req.socket?.remoteAddress 
    || null;
  const user_agent = req.headers["user-agent"] || null;
  return { ip_address, user_agent };
}

export async function logLogin(userId: string, req: any): Promise<void> {
  const { ip_address, user_agent } = getClientInfo(req);
  await createAuditLog({
    user_id: userId,
    action: "login",
    resource: "session",
    ip_address,
    user_agent,
  });
}

export async function logLogout(userId: string, req: any): Promise<void> {
  const { ip_address, user_agent } = getClientInfo(req);
  await createAuditLog({
    user_id: userId,
    action: "logout",
    resource: "session",
    ip_address,
    user_agent,
  });
}

export async function logIntakeSubmission(
  userId: string,
  intakeId: string,
  req: any,
  details?: Record<string, any>
): Promise<void> {
  const { ip_address, user_agent } = getClientInfo(req);
  await createAuditLog({
    user_id: userId,
    action: "intake_submitted",
    resource: "intake",
    resource_id: intakeId,
    details,
    ip_address,
    user_agent,
  });
}

export async function logStatusChange(
  userId: string,
  intakeId: string,
  oldStatus: string,
  newStatus: string,
  req: any
): Promise<void> {
  const { ip_address, user_agent } = getClientInfo(req);
  await createAuditLog({
    user_id: userId,
    action: "status_changed",
    resource: "intake",
    resource_id: intakeId,
    details: { old_status: oldStatus, new_status: newStatus },
    ip_address,
    user_agent,
  });
}

export async function logPacketGeneration(
  userId: string,
  intakeId: string,
  req: any,
  details?: Record<string, any>
): Promise<void> {
  const { ip_address, user_agent } = getClientInfo(req);
  await createAuditLog({
    user_id: userId,
    action: "packet_generated",
    resource: "intake",
    resource_id: intakeId,
    details,
    ip_address,
    user_agent,
  });
}

export async function logFileUpload(
  userId: string,
  intakeId: string,
  fileId: string,
  filename: string,
  req: any
): Promise<void> {
  const { ip_address, user_agent } = getClientInfo(req);
  await createAuditLog({
    user_id: userId,
    action: "file_uploaded",
    resource: "file",
    resource_id: fileId,
    details: { intake_id: intakeId, filename },
    ip_address,
    user_agent,
  });
}

export async function logFileDeleted(
  userId: string,
  intakeId: string,
  fileId: string,
  filename: string,
  req: any
): Promise<void> {
  const { ip_address, user_agent } = getClientInfo(req);
  await createAuditLog({
    user_id: userId,
    action: "file_deleted",
    resource: "file",
    resource_id: fileId,
    details: { intake_id: intakeId, filename },
    ip_address,
    user_agent,
  });
}

export async function logPreparerAssigned(
  userId: string,
  intakeId: string,
  preparerId: string,
  req: any
): Promise<void> {
  const { ip_address, user_agent } = getClientInfo(req);
  await createAuditLog({
    user_id: userId,
    action: "preparer_assigned",
    resource: "intake",
    resource_id: intakeId,
    details: { preparer_id: preparerId },
    ip_address,
    user_agent,
  });
}

export async function logChecklistItemCreated(
  userId: string,
  intakeId: string,
  itemId: string,
  description: string,
  req: any
): Promise<void> {
  const { ip_address, user_agent } = getClientInfo(req);
  await createAuditLog({
    user_id: userId,
    action: "checklist_item_created",
    resource: "checklist_item",
    resource_id: itemId,
    details: { intake_id: intakeId, description },
    ip_address,
    user_agent,
  });
}

export async function logChecklistItemResolved(
  userId: string,
  intakeId: string,
  itemId: string,
  req: any
): Promise<void> {
  const { ip_address, user_agent } = getClientInfo(req);
  await createAuditLog({
    user_id: userId,
    action: "checklist_item_resolved",
    resource: "checklist_item",
    resource_id: itemId,
    details: { intake_id: intakeId },
    ip_address,
    user_agent,
  });
}
