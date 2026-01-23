import { prisma } from "../lib/prisma";
import { decryptFromBytea } from "../lib/crypto";

export interface ValidationResult {
  valid: boolean;
  missingFields: MissingItem[];
  missingDocs: MissingItem[];
  warnings: string[];
}

export interface MissingItem {
  field: string;
  description: string;
  section: string;
}

function isValidSSN(ssn: string): boolean {
  const cleaned = ssn.replace(/\D/g, "");
  if (cleaned.length !== 9) return false;
  if (cleaned === "000000000") return false;
  if (cleaned.substring(0, 3) === "000") return false;
  if (cleaned.substring(0, 3) === "666") return false;
  if (cleaned.substring(0, 1) === "9") return false;
  return true;
}

function isValidIPPin(pin: string): boolean {
  const cleaned = pin.replace(/\D/g, "");
  return cleaned.length === 6;
}

function isValidRoutingNumber(routing: string): boolean {
  const cleaned = routing.replace(/\D/g, "");
  if (cleaned.length !== 9) return false;
  
  const digits = cleaned.split("").map(Number);
  const checksum = (
    3 * (digits[0] + digits[3] + digits[6]) +
    7 * (digits[1] + digits[4] + digits[7]) +
    1 * (digits[2] + digits[5] + digits[8])
  ) % 10;
  
  return checksum === 0;
}

function isValidAccountNumber(account: string): boolean {
  const cleaned = account.replace(/\D/g, "");
  return cleaned.length >= 4 && cleaned.length <= 17;
}

export async function validateIntake(intakeId: string): Promise<ValidationResult> {
  const missingFields: MissingItem[] = [];
  const missingDocs: MissingItem[] = [];
  const warnings: string[] = [];

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
    },
  });

  if (!intake) {
    return { valid: false, missingFields: [], missingDocs: [], warnings: ["Intake not found"] };
  }

  const taxpayerInfo = intake.taxpayer_info;
  const filingStatus = intake.filing_status;
  const files = intake.files;

  if (!taxpayerInfo?.taxpayer_first_name?.trim()) {
    missingFields.push({ field: "taxpayer_first_name", description: "Taxpayer first name is required", section: "Personal Info" });
  }
  if (!taxpayerInfo?.taxpayer_last_name?.trim()) {
    missingFields.push({ field: "taxpayer_last_name", description: "Taxpayer last name is required", section: "Personal Info" });
  }
  if (!taxpayerInfo?.taxpayer_dob) {
    missingFields.push({ field: "taxpayer_dob", description: "Taxpayer date of birth is required", section: "Personal Info" });
  }

  if (!taxpayerInfo?.taxpayer_ssn_encrypted) {
    missingFields.push({ field: "taxpayer_ssn", description: "Taxpayer Social Security Number is required", section: "Personal Info" });
  } else {
    try {
      const ssn = decryptFromBytea(taxpayerInfo.taxpayer_ssn_encrypted);
      if (!isValidSSN(ssn)) {
        missingFields.push({ field: "taxpayer_ssn", description: "Taxpayer SSN format is invalid", section: "Personal Info" });
      }
    } catch {
      missingFields.push({ field: "taxpayer_ssn", description: "Taxpayer SSN could not be verified", section: "Personal Info" });
    }
  }

  if (taxpayerInfo?.taxpayer_ip_pin_encrypted) {
    try {
      const pin = decryptFromBytea(taxpayerInfo.taxpayer_ip_pin_encrypted);
      if (!isValidIPPin(pin)) {
        missingFields.push({ field: "taxpayer_ip_pin", description: "Taxpayer IP PIN must be 6 digits", section: "Personal Info" });
      }
    } catch {
      missingFields.push({ field: "taxpayer_ip_pin", description: "Taxpayer IP PIN could not be verified", section: "Personal Info" });
    }
  }

  if (!taxpayerInfo?.taxpayer_phone?.trim()) {
    missingFields.push({ field: "taxpayer_phone", description: "At least one phone number is required", section: "Personal Info" });
  }

  if (!taxpayerInfo?.address_city?.trim()) {
    missingFields.push({ field: "address_city", description: "City is required", section: "Address" });
  }
  if (!taxpayerInfo?.address_state?.trim()) {
    missingFields.push({ field: "address_state", description: "State is required", section: "Address" });
  }
  if (!taxpayerInfo?.address_zip?.trim()) {
    missingFields.push({ field: "address_zip", description: "ZIP code is required", section: "Address" });
  }

  if (!filingStatus?.filing_status) {
    missingFields.push({ field: "filing_status", description: "Filing status is required", section: "Filing Status" });
  }

  const requiresSpouse = filingStatus?.filing_status === "married" || filingStatus?.filing_status === "married_filing_separately";
  
  if (requiresSpouse) {
    if (!taxpayerInfo?.spouse_first_name?.trim()) {
      missingFields.push({ field: "spouse_first_name", description: "Spouse first name is required for married filing", section: "Spouse Info" });
    }
    if (!taxpayerInfo?.spouse_last_name?.trim()) {
      missingFields.push({ field: "spouse_last_name", description: "Spouse last name is required for married filing", section: "Spouse Info" });
    }
    if (!taxpayerInfo?.spouse_dob) {
      missingFields.push({ field: "spouse_dob", description: "Spouse date of birth is required for married filing", section: "Spouse Info" });
    }
    if (!taxpayerInfo?.spouse_ssn_encrypted) {
      missingFields.push({ field: "spouse_ssn", description: "Spouse Social Security Number is required for married filing", section: "Spouse Info" });
    } else {
      try {
        const ssn = decryptFromBytea(taxpayerInfo.spouse_ssn_encrypted);
        if (!isValidSSN(ssn)) {
          missingFields.push({ field: "spouse_ssn", description: "Spouse SSN format is invalid", section: "Spouse Info" });
        }
      } catch {
        missingFields.push({ field: "spouse_ssn", description: "Spouse SSN could not be verified", section: "Spouse Info" });
      }
    }

    if (taxpayerInfo?.spouse_ip_pin_encrypted) {
      try {
        const pin = decryptFromBytea(taxpayerInfo.spouse_ip_pin_encrypted);
        if (!isValidIPPin(pin)) {
          missingFields.push({ field: "spouse_ip_pin", description: "Spouse IP PIN must be 6 digits", section: "Spouse Info" });
        }
      } catch {
        missingFields.push({ field: "spouse_ip_pin", description: "Spouse IP PIN could not be verified", section: "Spouse Info" });
      }
    }
  }

  const hasPhotoIdFront = files.some(f => f.file_category === "photo_id_front");
  const hasPhotoIdBack = files.some(f => f.file_category === "photo_id_back");
  
  if (!hasPhotoIdFront) {
    missingDocs.push({ field: "photo_id_front", description: "Taxpayer photo ID (front) is required", section: "Photo ID" });
  }
  if (!hasPhotoIdBack) {
    missingDocs.push({ field: "photo_id_back", description: "Taxpayer photo ID (back) is required", section: "Photo ID" });
  }

  if (requiresSpouse) {
    const hasSpousePhotoIdFront = files.some(f => f.file_category === "spouse_photo_id_front");
    const hasSpousePhotoIdBack = files.some(f => f.file_category === "spouse_photo_id_back");
    
    if (!hasSpousePhotoIdFront) {
      missingDocs.push({ field: "spouse_photo_id_front", description: "Spouse photo ID (front) is required", section: "Spouse Photo ID" });
    }
    if (!hasSpousePhotoIdBack) {
      missingDocs.push({ field: "spouse_photo_id_back", description: "Spouse photo ID (back) is required", section: "Spouse Photo ID" });
    }
  }

  for (const bank of intake.bank_accounts) {
    if (bank.routing_number_encrypted) {
      try {
        const routing = decryptFromBytea(bank.routing_number_encrypted);
        if (!isValidRoutingNumber(routing)) {
          missingFields.push({ 
            field: `bank_${bank.id}_routing`, 
            description: `Bank account routing number is invalid (must be 9 digits with valid checksum)`, 
            section: "Bank Accounts" 
          });
        }
      } catch {
        missingFields.push({ field: `bank_${bank.id}_routing`, description: "Bank routing number could not be verified", section: "Bank Accounts" });
      }
    }

    if (bank.account_number_encrypted) {
      try {
        const account = decryptFromBytea(bank.account_number_encrypted);
        if (!isValidAccountNumber(account)) {
          missingFields.push({ 
            field: `bank_${bank.id}_account`, 
            description: `Bank account number is invalid (must be 4-17 digits)`, 
            section: "Bank Accounts" 
          });
        }
      } catch {
        missingFields.push({ field: `bank_${bank.id}_account`, description: "Bank account number could not be verified", section: "Bank Accounts" });
      }
    }
  }

  const dependentSSNs: string[] = [];
  let taxpayerSSN = "";
  let spouseSSN = "";

  if (taxpayerInfo?.taxpayer_ssn_encrypted) {
    try {
      taxpayerSSN = decryptFromBytea(taxpayerInfo.taxpayer_ssn_encrypted);
    } catch {}
  }
  if (taxpayerInfo?.spouse_ssn_encrypted) {
    try {
      spouseSSN = decryptFromBytea(taxpayerInfo.spouse_ssn_encrypted);
    } catch {}
  }

  for (const dep of intake.dependents) {
    if (dep.ssn_encrypted) {
      try {
        const ssn = decryptFromBytea(dep.ssn_encrypted);
        if (ssn === taxpayerSSN) {
          missingFields.push({
            field: `dependent_${dep.id}_ssn`,
            description: `Dependent ${dep.first_name || "unknown"}'s SSN matches taxpayer SSN`,
            section: "Dependents"
          });
        }
        if (ssn === spouseSSN && spouseSSN) {
          missingFields.push({
            field: `dependent_${dep.id}_ssn`,
            description: `Dependent ${dep.first_name || "unknown"}'s SSN matches spouse SSN`,
            section: "Dependents"
          });
        }
        if (dependentSSNs.includes(ssn)) {
          missingFields.push({
            field: `dependent_${dep.id}_ssn`,
            description: `Dependent ${dep.first_name || "unknown"}'s SSN is duplicated`,
            section: "Dependents"
          });
        }
        dependentSSNs.push(ssn);
      } catch {}
    }
  }

  const hasTaxDoc = files.some(f => 
    ["w2", "1099_int", "1099_div", "1099_misc", "1099_nec", "1099_r", "1099_k", "1098", "other"].includes(f.file_category)
  );
  
  if (!hasTaxDoc) {
    missingDocs.push({ 
      field: "tax_documents", 
      description: "At least one tax document (W-2, 1099, 1099-K, 1098, or other) is required", 
      section: "Tax Documents" 
    });
  }

  const valid = missingFields.length === 0 && missingDocs.length === 0;

  return { valid, missingFields, missingDocs, warnings };
}

export async function syncChecklistFromValidation(intakeId: string, userId?: string): Promise<void> {
  const validation = await validateIntake(intakeId);
  
  const existingItems = await prisma.checklist_items.findMany({
    where: { 
      intake_id: intakeId,
      item_type: { in: ["missing_field", "missing_document"] }
    }
  });

  const currentFieldKeys = new Set([
    ...validation.missingFields.map(f => `missing_field:${f.field}`),
    ...validation.missingDocs.map(d => `missing_document:${d.field}`)
  ]);

  for (const item of existingItems) {
    const key = `${item.item_type}:${item.field_name}`;
    if (!currentFieldKeys.has(key) && !item.is_resolved) {
      await prisma.checklist_items.update({
        where: { id: item.id },
        data: { 
          is_resolved: true, 
          resolved_at: new Date(),
          resolved_by_user_id: userId || null
        }
      });
    }
  }

  for (const field of validation.missingFields) {
    await prisma.checklist_items.upsert({
      where: {
        intake_id_item_type_field_name: {
          intake_id: intakeId,
          item_type: "missing_field",
          field_name: field.field
        }
      },
      create: {
        intake_id: intakeId,
        item_type: "missing_field",
        field_name: field.field,
        description: field.description,
        is_resolved: false,
        created_by_user_id: userId || null
      },
      update: {
        description: field.description,
        is_resolved: false,
        resolved_at: null,
        resolved_by_user_id: null
      }
    });
  }

  for (const doc of validation.missingDocs) {
    await prisma.checklist_items.upsert({
      where: {
        intake_id_item_type_field_name: {
          intake_id: intakeId,
          item_type: "missing_document",
          field_name: doc.field
        }
      },
      create: {
        intake_id: intakeId,
        item_type: "missing_document",
        field_name: doc.field,
        description: doc.description,
        is_resolved: false,
        created_by_user_id: userId || null
      },
      update: {
        description: doc.description,
        is_resolved: false,
        resolved_at: null,
        resolved_by_user_id: null
      }
    });
  }
}
