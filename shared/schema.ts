import { z } from "zod";

// === ROLE TYPES ===
export const roleEnum = ["client", "preparer", "admin"] as const;
export type Role = typeof roleEnum[number];

// === INTAKE STATUS TYPES ===
export const intakeStatusEnum = [
  "draft",
  "submitted",
  "in_review",
  "ready_for_drake",
  "filed",
  "accepted",
  "rejected",
] as const;
export type IntakeStatus = typeof intakeStatusEnum[number];

// === FILING STATUS TYPES ===
export const filingStatusTypeEnum = [
  "single",
  "married",
  "widowed",
  "married_filing_separately",
  "head_of_household",
] as const;
export type FilingStatusType = typeof filingStatusTypeEnum[number];

// === PERSON TYPE ===
export const personTypeEnum = ["taxpayer", "spouse"] as const;
export type PersonType = typeof personTypeEnum[number];

// === ID TYPE ===
export const idTypeEnum = ["drivers_license", "state_id"] as const;
export type IdType = typeof idTypeEnum[number];

// === ACCOUNT TYPE ===
export const accountTypeEnum = ["checking", "savings"] as const;
export type AccountType = typeof accountTypeEnum[number];

// === TAX AUTHORITY ===
export const taxAuthorityEnum = ["federal", "resident_state", "resident_city"] as const;
export type TaxAuthority = typeof taxAuthorityEnum[number];

// === PAYMENT PERIOD ===
export const paymentPeriodEnum = [
  "overpayment_2024",
  "q1",
  "q2",
  "q3",
  "q4",
  "additional",
] as const;
export type PaymentPeriod = typeof paymentPeriodEnum[number];

// === FILE CATEGORY ===
export const fileCategoryEnum = [
  "photo_id_front",
  "photo_id_back",
  "w2",
  "1099_int",
  "1099_div",
  "1099_misc",
  "1099_nec",
  "1099_r",
  "1098",
  "other",
] as const;
export type FileCategory = typeof fileCategoryEnum[number];

// === CHECKLIST ITEM TYPE ===
export const checklistItemTypeEnum = [
  "missing_field",
  "missing_document",
  "clarification_needed",
  "custom",
] as const;
export type ChecklistItemType = typeof checklistItemTypeEnum[number];

// === AUDIT RESULT ===
export const auditResultEnum = ["success", "failure"] as const;
export type AuditResult = typeof auditResultEnum[number];

// === PACKET REQUEST STATUS ===
export const packetRequestStatusEnum = ["pending", "processing", "completed", "failed"] as const;
export type PacketRequestStatus = typeof packetRequestStatusEnum[number];

// === USER TYPES ===
export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: Role;
  created_at: Date;
  updated_at: Date;
}

export interface SessionUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
}

export interface AuthSession {
  user: SessionUser;
  token: string;
  expires_at: Date;
}

// === SESSION TYPES ===
export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
}

// === INTAKE TYPES ===
export interface Intake {
  id: string;
  user_id: string;
  tax_year: number;
  status: IntakeStatus;
  assigned_preparer_id: string | null;
  created_at: Date;
  updated_at: Date;
}

// === TAXPAYER INFO TYPES ===
export interface TaxpayerInfo {
  id: string;
  intake_id: string;
  taxpayer_first_name: string | null;
  taxpayer_middle_initial: string | null;
  taxpayer_last_name: string | null;
  taxpayer_dob: Date | null;
  taxpayer_occupation: string | null;
  taxpayer_phone: string | null;
  taxpayer_email: string | null;
  spouse_first_name: string | null;
  spouse_middle_initial: string | null;
  spouse_last_name: string | null;
  spouse_dob: Date | null;
  spouse_occupation: string | null;
  spouse_phone: string | null;
  spouse_email: string | null;
  address_street: string | null;
  address_apt: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  resident_state: string | null;
  resident_city: string | null;
  school_district: string | null;
  county: string | null;
  appointment_scheduled_for: string | null;
  created_at: Date;
  updated_at: Date;
}

// === FILING STATUS TYPES ===
export interface FilingStatus {
  id: string;
  intake_id: string;
  filing_status: FilingStatusType;
  spouse_itemizes_separately: boolean | null;
  can_be_claimed_as_dependent: boolean | null;
  spouse_can_be_claimed: boolean | null;
  created_at: Date;
  updated_at: Date;
}

// === PHOTO ID TYPES ===
export interface PhotoId {
  id: string;
  intake_id: string;
  person_type: PersonType;
  id_type: IdType;
  issuing_state: string | null;
  issue_date: Date | null;
  expiration_date: Date | null;
  front_file_id: string | null;
  back_file_id: string | null;
  created_at: Date;
  updated_at: Date;
}

// === BANK ACCOUNT TYPES ===
export interface BankAccount {
  id: string;
  intake_id: string;
  account_type: AccountType;
  bank_name: string | null;
  is_primary: boolean;
  created_at: Date;
  updated_at: Date;
}

// === DEPENDENT TYPES ===
export interface Dependent {
  id: string;
  intake_id: string;
  first_name: string | null;
  middle_initial: string | null;
  last_name: string | null;
  dob: Date | null;
  relationship: string | null;
  months_lived_with: number | null;
  is_student: boolean | null;
  is_disabled: boolean | null;
  provides_over_half_support: boolean | null;
  created_at: Date;
  updated_at: Date;
}

// === CHILDCARE PROVIDER TYPES ===
export interface ChildcareProvider {
  id: string;
  intake_id: string;
  provider_name: string | null;
  provider_address: string | null;
  provider_city: string | null;
  provider_state: string | null;
  provider_zip: string | null;
  amount_paid: number | null;
  created_at: Date;
  updated_at: Date;
}

// === ESTIMATED PAYMENT TYPES ===
export interface EstimatedPayment {
  id: string;
  intake_id: string;
  tax_authority: TaxAuthority;
  payment_period: PaymentPeriod;
  amount: number;
  date_paid: Date | null;
  created_at: Date;
  updated_at: Date;
}

// === FILE TYPES ===
export interface File {
  id: string;
  intake_id: string;
  file_category: FileCategory;
  original_filename: string;
  stored_filename: string;
  mime_type: string;
  file_size: number;
  checksum_sha256: string;
  uploaded_by_id: string | null;
  created_at: Date;
  updated_at: Date;
}

// === MESSAGE TYPES ===
export interface Message {
  id: string;
  intake_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: Date;
}

// === CHECKLIST ITEM TYPES ===
export interface ChecklistItem {
  id: string;
  intake_id: string;
  item_type: ChecklistItemType;
  field_name: string | null;
  description: string;
  is_resolved: boolean;
  resolved_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// === AUDIT LOG TYPES ===
export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource: string;
  resource_id: string | null;
  result: AuditResult;
  ip_address: string | null;
  user_agent: string | null;
  details: Record<string, unknown> | null;
  created_at: Date;
}

// === STATUS HISTORY TYPES ===
export interface StatusHistory {
  id: string;
  intake_id: string;
  old_status: IntakeStatus | null;
  new_status: IntakeStatus;
  changed_by_id: string | null;
  notes: string | null;
  created_at: Date;
}

// === PREPARER PACKET REQUEST TYPES ===
export interface PreparerPacketRequest {
  id: string;
  intake_id: string;
  requested_by_id: string;
  status: PacketRequestStatus;
  packet_url: string | null;
  error_message: string | null;
  created_at: Date;
  updated_at: Date;
  completed_at: Date | null;
}

// === ZOD SCHEMAS ===

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
  first_name: z.string().min(1, "First name is required").max(50, "First name is too long"),
  last_name: z.string().min(1, "Last name is required").max(50, "Last name is too long"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

// === INSERT TYPES ===

export interface InsertUser {
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role?: Role;
}

export interface InsertSession {
  user_id: string;
  token: string;
  expires_at: Date;
}

export interface InsertIntake {
  user_id: string;
  tax_year: number;
  status?: IntakeStatus;
  assigned_preparer_id?: string;
}

export interface InsertTaxpayerInfo {
  intake_id: string;
  taxpayer_first_name?: string;
  taxpayer_middle_initial?: string;
  taxpayer_last_name?: string;
  taxpayer_dob?: Date;
  taxpayer_occupation?: string;
  taxpayer_phone?: string;
  taxpayer_email?: string;
  spouse_first_name?: string;
  spouse_middle_initial?: string;
  spouse_last_name?: string;
  spouse_dob?: Date;
  spouse_occupation?: string;
  spouse_phone?: string;
  spouse_email?: string;
  address_street?: string;
  address_apt?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  resident_state?: string;
  resident_city?: string;
  school_district?: string;
  county?: string;
  appointment_scheduled_for?: string;
}

export interface InsertFilingStatus {
  intake_id: string;
  filing_status: FilingStatusType;
  spouse_itemizes_separately?: boolean;
  can_be_claimed_as_dependent?: boolean;
  spouse_can_be_claimed?: boolean;
}

export interface InsertFile {
  intake_id: string;
  file_category: FileCategory;
  original_filename: string;
  stored_filename: string;
  mime_type: string;
  file_size: number;
  checksum_sha256: string;
  uploaded_by_id?: string;
}

export interface InsertMessage {
  intake_id: string;
  sender_id: string;
  content: string;
}

export interface InsertChecklistItem {
  intake_id: string;
  item_type: ChecklistItemType;
  field_name?: string;
  description: string;
}

export interface InsertAuditLog {
  user_id?: string;
  action: string;
  resource: string;
  resource_id?: string;
  result: AuditResult;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, unknown>;
}

export interface InsertStatusHistory {
  intake_id: string;
  old_status?: IntakeStatus;
  new_status: IntakeStatus;
  changed_by_id?: string;
  notes?: string;
}
