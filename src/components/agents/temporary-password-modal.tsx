"use client";

import { Copy, TriangleAlert } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { buttonClass } from "@/components/ui/button";

export function TemporaryPasswordModal({
  agentName,
  password,
  onClose,
}: {
  agentName: string;
  password: string;
  onClose: () => void;
}) {
  const toast = useToast();

  async function copy() {
    try {
      await navigator.clipboard.writeText(password);
      toast.success("Password copied");
    } catch {
      toast.error("Couldn't copy. Select the password and copy it manually.");
    }
  }

  return (
    <Modal open onClose={onClose} title="Temporary password">
      <p className="text-sm text-slate-600">
        Share this password with <span className="font-medium text-ink">{agentName}</span>.
        They should change it after their first login.
      </p>

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <code className="flex-1 break-all text-sm font-semibold text-ink">{password}</code>
        <button onClick={copy} className={buttonClass("outline")}>
          <Copy size={16} /> Copy
        </button>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
        <TriangleAlert size={18} className="mt-0.5 shrink-0" />
        <p>This password will not be shown again. Copy it now.</p>
      </div>

      <button onClick={onClose} className={buttonClass("primary", "md", "mt-6 w-full")}>
        I've copied it
      </button>
    </Modal>
  );
}