import fs from "fs";
import path from "path";
import archiver from "archiver";
import { prisma } from "../lib/prisma";
import { generateSummaryPDF } from "./pdf";
import { createAuditLog } from "./audit";
import { fileStorage } from "./storage";

const EXPORTS_DIR = path.join(process.cwd(), "exports");

const FILE_CATEGORY_FOLDERS: Record<string, string> = {
  photo_id_front: "Photo_ID",
  photo_id_back: "Photo_ID",
  spouse_photo_id_front: "Photo_ID",
  spouse_photo_id_back: "Photo_ID",
  w2: "W2",
  "1099_int": "1099/1099_int",
  "1099_div": "1099/1099_div",
  "1099_misc": "1099/1099_misc",
  "1099_nec": "1099/1099_nec",
  "1099_r": "1099/1099_r",
  "1099_k": "1099/1099_k",
  "1098": "1098",
  other: "Other",
};

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.{2,}/g, ".");
}

export async function processPacketRequest(requestId: string): Promise<void> {
  const request = await prisma.preparer_packet_requests.findUnique({
    where: { id: requestId },
    include: { intake: true },
  });

  if (!request) {
    throw new Error("Packet request not found");
  }

  const intakeId = request.intake_id;

  await prisma.preparer_packet_requests.update({
    where: { id: requestId },
    data: { status: "processing" },
  });

  try {
    const intake = await prisma.intakes.findUnique({
      where: { id: intakeId },
      include: {
        taxpayer_info: true,
        filing_status: true,
        photo_ids: true,
        bank_accounts: true,
        dependents: true,
        childcare_providers: true,
        estimated_payments: true,
        files: true,
        checklist_items: true,
      },
    });

    if (!intake) {
      throw new Error("Intake not found");
    }

    const exportDir = path.join(EXPORTS_DIR, intakeId, requestId);
    await fs.promises.mkdir(exportDir, { recursive: true });

    const pdfPath = path.join(exportDir, "Summary.pdf");
    const pdfStream = fs.createWriteStream(pdfPath);
    
    await new Promise<void>((resolve, reject) => {
      pdfStream.on("finish", resolve);
      pdfStream.on("error", reject);
      generateSummaryPDF(intake, pdfStream);
    });

    const zipPath = path.join(exportDir, "Packet.zip");
    const zipStream = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    // Pre-fetch all files from storage before creating the archive
    const fileBuffers: { folder: string; safeName: string; buffer: Buffer }[] = [];
    for (const file of intake.files) {
      const folder = FILE_CATEGORY_FOLDERS[file.file_category] || "Other";
      const safeName = sanitizeFilename(`${file.file_category}__${file.original_filename}`);
      
      try {
        const exists = await fileStorage.exists(file.storage_key);
        if (exists) {
          const buffer = await fileStorage.download(file.storage_key);
          fileBuffers.push({ folder, safeName, buffer });
          console.log(`Fetched file for packet: ${safeName}`);
        } else {
          console.warn(`File not found in storage: ${file.storage_key}`);
        }
      } catch (err) {
        console.error(`Error fetching file for packet: ${file.storage_key}`, err);
      }
    }

    await new Promise<void>((resolve, reject) => {
      zipStream.on("close", resolve);
      zipStream.on("error", reject);
      archive.on("error", reject);

      archive.pipe(zipStream);

      // Add summary PDF
      archive.file(pdfPath, { name: "Summary.pdf" });

      // Add all pre-fetched documents
      for (const { folder, safeName, buffer } of fileBuffers) {
        archive.append(buffer, { name: `${folder}/${safeName}` });
        console.log(`Added file to packet: ${safeName}`);
      }

      archive.finalize();
    });

    await prisma.preparer_packet_requests.update({
      where: { id: requestId },
      data: {
        status: "completed",
        packet_url: `${intakeId}/${requestId}`,
        completed_at: new Date(),
      },
    });

    await createAuditLog({
      user_id: request.requested_by_id,
      action: "packet_generated",
      resource: "intake",
      resource_id: intakeId,
      details: { request_id: requestId, status: "completed" },
    });

  } catch (error: any) {
    console.error("Packet generation failed:", error);
    
    await prisma.preparer_packet_requests.update({
      where: { id: requestId },
      data: {
        status: "failed",
        error_message: error.message || "Unknown error",
      },
    });

    await createAuditLog({
      user_id: request.requested_by_id,
      action: "packet_generated",
      resource: "intake",
      resource_id: intakeId,
      result: "failure",
      details: { request_id: requestId, error: error.message },
    });

    throw error;
  }
}

export function getPacketPath(packetUrl: string, filename: "Summary.pdf" | "Packet.zip"): string {
  return path.join(EXPORTS_DIR, packetUrl, filename);
}
