import type { Role } from "@/lib/api/session";

export function homeForRole(role: Role) {
  if (role === "admin") return "/admin";
  if (role === "agent") return "/agent";
  return "/dashboard";
}