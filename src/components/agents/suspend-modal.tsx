"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { suspendAgent } from "@/lib/api/agents";
import type { Agent } from "@/lib/api/types";
import { Modal } from "@/components/ui/modal";
import { ErrorNotice } from "@/components/ui/error-notice";
import { buttonClass } from "@/components/ui/button";

export function SuspendModal({
  agent,
  onClose,
  onDone,
}: {
  agent: Agent;
  onClose: () => void;
  onDone: (agent: Agent) => void;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setLoading(true);
    setError(null);
    try {
      onDone(await suspendAgent(agent.id, reason.trim() || undefined));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to suspend agent");
      setLoading(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Suspend ${agent.name}?`}>
      <p className="text-sm text-slate-600">
        They won't be able to log in until you activate the account again.
      </p>

      <label className="mt-4 block text-sm font-medium text-slate-700">
        Reason <span className="font-normal text-slate-500">(optional)</span>
      </label>
      <textarea
        rows={3}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      />

      <div className="mt-4">
        <ErrorNotice message={error} />
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button onClick={onClose} className={buttonClass("ghost")}>
          Cancel
        </button>
        <button
          onClick={confirm}
          disabled={loading}
          className={buttonClass("primary", "md", "bg-red-600 hover:bg-red-700")}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : "Suspend agent"}
        </button>
      </div>
    </Modal>
  );
}