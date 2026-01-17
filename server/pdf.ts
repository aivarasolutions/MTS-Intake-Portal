import PDFDocument from "pdfkit";
import { decryptFromBytea } from "../lib/crypto";

export async function generateSummaryPDF(intake: any, stream: NodeJS.WritableStream): Promise<void> {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(stream);

  // Helper to mask sensitive data
  const maskSSN = (val?: string) => val ? `XXX-XX-${val.slice(-4)}` : "Not provided";
  const maskAccount = (val?: string) => val ? `****${val.slice(-4)}` : "Not provided";

  // Header
  doc.fontSize(20).text("MTS 1040 Preparer Summary", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Tax Year: ${intake.tax_year}`);
  doc.text(`Status: ${intake.status.toUpperCase()}`);
  doc.text(`Submitted At: ${intake.submitted_at ? new Date(intake.submitted_at).toLocaleString() : "Not submitted"}`);
  doc.moveDown();

  // Personal Info
  doc.fontSize(16).text("Personal Information", { underline: true });
  const tp = intake.taxpayer_info || {};
  doc.fontSize(12).text(`Taxpayer: ${tp.taxpayer_first_name || ""} ${tp.taxpayer_last_name || ""}`);
  doc.text(`Email: ${tp.taxpayer_email || "N/A"}`);
  doc.text(`Phone: ${tp.taxpayer_phone || "N/A"}`);
  doc.text(`DOB: ${tp.taxpayer_dob ? new Date(tp.taxpayer_dob).toLocaleDateString() : "N/A"}`);
  
  let ssn = "Not provided";
  if (tp.taxpayer_ssn_encrypted) {
    try { ssn = maskSSN(decryptFromBytea(tp.taxpayer_ssn_encrypted)); } catch {}
  }
  doc.text(`SSN: ${ssn}`);
  doc.moveDown();

  if (tp.has_spouse) {
    doc.fontSize(14).text("Spouse Information");
    doc.fontSize(12).text(`Spouse: ${tp.spouse_first_name || ""} ${tp.spouse_last_name || ""}`);
    let s_ssn = "Not provided";
    if (tp.spouse_ssn_encrypted) {
      try { s_ssn = maskSSN(decryptFromBytea(tp.spouse_ssn_encrypted)); } catch {}
    }
    doc.text(`SSN: ${s_ssn}`);
    doc.moveDown();
  }

  // Address
  doc.fontSize(14).text("Address");
  doc.fontSize(12).text(`${tp.address_street || ""}${tp.address_apt ? ", " + tp.address_apt : ""}`);
  doc.text(`${tp.address_city || ""}, ${tp.address_state || ""} ${tp.address_zip || ""}`);
  doc.moveDown();

  // Dependents
  if (intake.dependents && intake.dependents.length > 0) {
    doc.fontSize(16).text("Dependents", { underline: true });
    intake.dependents.forEach((d: any) => {
      let d_ssn = "Not provided";
      if (d.ssn_encrypted) {
        try { d_ssn = maskSSN(decryptFromBytea(d.ssn_encrypted)); } catch {}
      }
      doc.fontSize(12).text(`${d.first_name} ${d.last_name} (${d.relationship}) - SSN: ${d_ssn}`);
    });
    doc.moveDown();
  }

  // Bank Accounts
  if (intake.bank_accounts && intake.bank_accounts.length > 0) {
    doc.fontSize(16).text("Bank Accounts", { underline: true });
    intake.bank_accounts.forEach((b: any) => {
      let acc = "Not provided";
      if (b.account_number_encrypted) {
        try { acc = maskAccount(decryptFromBytea(b.account_number_encrypted)); } catch {}
      }
      doc.fontSize(12).text(`${b.bank_name} (${b.account_type}) - Account: ${acc}`);
    });
    doc.moveDown();
  }

  // Checklist
  if (intake.checklist_items && intake.checklist_items.length > 0) {
    doc.fontSize(16).text("Checklist Items", { underline: true });
    const unresolved = intake.checklist_items.filter((i: any) => !i.is_resolved);
    if (unresolved.length > 0) {
      unresolved.forEach((i: any) => {
        doc.fontSize(12).text(`[ ] ${i.item_type}: ${i.description}`);
      });
    } else {
      doc.fontSize(12).text("All items resolved.");
    }
  }

  doc.end();
}
