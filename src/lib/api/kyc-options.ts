import type { KycDocumentKind, KycStatus } from "@/lib/api/kyc";
import { humanize } from "@/lib/format";

export interface Option {
  label: string;
  value: string;
}

export const idTypeOptions: Option[] = [
  { label: "National ID card", value: "national_id" },
  { label: "Driver's license", value: "drivers_license" },
  { label: "Voter's card", value: "voters_card" },
  { label: "International passport", value: "international_passport" },
];

export const employmentOptions: Option[] = [
  { label: "Employed", value: "employed" },
  { label: "Self-employed", value: "self_employed" },
  { label: "Student", value: "student" },
  { label: "Unemployed", value: "unemployed" },
  { label: "Retired", value: "retired" },
];

export const kycStatusLabels: Record<KycStatus, string> = {
  not_started: "Not started",
  draft: "In progress",
  submitted: "Submitted",
  approved: "Approved",
  changes_requested: "Changes requested",
  rejected: "Rejected",
};

export const documentLabels: Record<KycDocumentKind, string> = {
  id_front: "ID card (front)",
  id_back: "ID card (back)",
  selfie: "Live photo",
  proof_of_address: "Proof of address",
};

export function optionLabel(options: Option[], value: string | null | undefined) {
  if (!value) return "—";
  return options.find((o) => o.value === value)?.label ?? humanize(value);
}

const fieldLabels: Record<string, string> = {
  legalName: "Full legal name",
  dateOfBirth: "Date of birth",
  phone: "Phone number",
  address: "Home address",
  bvn: "BVN",
  nin: "NIN",
  idType: "ID type",
  idNumber: "ID number",
  idExpiry: "ID expiry date",
  employmentStatus: "Employment status",
  employerName: "Employer name",
  employerAddress: "Employer address",
  jobTitle: "Job title",
  nextOfKinName: "Next of kin name",
  nextOfKinPhone: "Next of kin phone",
  nextOfKinRelationship: "Next of kin relationship",
  consent: "Consent",
};

/** Turns "document:id_front" or "legalName" from `missing` into readable text. */
export function missingLabel(name: string) {
  if (name.startsWith("document:")) {
    const kind = name.slice("document:".length) as KycDocumentKind;
    return documentLabels[kind] ?? humanize(kind);
  }
  return fieldLabels[name] ?? humanize(name);
}