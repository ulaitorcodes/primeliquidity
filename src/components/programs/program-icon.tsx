import { Bird, GraduationCap, Layers, type LucideIcon } from "lucide-react";

const icons: Record<string, LucideIcon> = {
  "graduation-cap": GraduationCap,
  bird: Bird,
};

export function ProgramIcon({ name, size = 24 }: { name: string; size?: number }) {
  const Icon = icons[name] ?? Layers;
  return <Icon size={size} />;
}