import { Logo } from "@/components/site/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-white px-4 py-10">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}