import type { MerchantKind } from "@/lib/api/finance-types";

export const merchantKindOptions: { label: string; value: MerchantKind }[] = [
  { label: "School", value: "school" },
  { label: "Landlord", value: "landlord" },
  { label: "Developer", value: "developer" },
  { label: "Supplier", value: "supplier" },
  { label: "Other", value: "other" },
];

export const merchantKindLabels: Record<MerchantKind, string> = {
  school: "School",
  landlord: "Landlord",
  developer: "Developer",
  supplier: "Supplier",
  other: "Other",
};