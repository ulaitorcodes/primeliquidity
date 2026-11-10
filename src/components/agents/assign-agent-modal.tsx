"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { assignAgent, listAgents } from "@/lib/api/agents";
import { useLoad } from "@/lib/use-load";
import { ErrorNotice } from "@/components/ui/error-notice";
import { FormField, inputClass } from "@/components/ui/form-field";
import { Modal } from "@/components/ui/modal";
import { buttonClass } from "@/components/ui/button";

export interface AssignResult {
  agentId: string | null;
  agentName: string | null;
  assigned: number;
}

const NONE = "__none__";
const loadActiveAgents = () => listAgents({ status: "active" });

/** Pass applicationIds, applicantEmail, or both (then the admin picks the scope). */
export function AssignAgentModal({
  applicationIds,
  applicantEmail,
  onClose,
  onDone,
}: {
  applicationIds?: string[];
  applicantEmail?: string;
  onClose: () => void;
  onDone: (result: AssignResult) => void;
}) {
  const agents = useLoad(loadActiveAgents);
  const hasIds = !!applicationIds && applicationIds.length > 0;
  const hasEmail = !!applicantEmail;

  const [selection, setSelection] = useState("");
  const [scope, setScope] = useState<"applications" | "email">(hasIds ? "applications" : "email");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current) return;
    if (!selection) {
      setError("Choose an agent, or choose to unassign.");
      return;
    }

    const agentId = selection === NONE ? null : selection;
    // Exactly one of applicationIds / applicantEmail
    const body =
      scope === "email" && hasEmail
        ? { agentId, applicantEmail }
        : { agentId, applicationIds };

    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      const res = await assignAgent(body);
      const agent = (agents.data ?? []).find((a) => a.id === agentId);
      onDone({ agentId: res.agentId, agentName: agent?.name ?? null, assigned: res.assigned });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't assign the agent");
      setBusy(false);
      submitting.current = false;
    }
  }

  return (
    <Modal open onClose={onClose} title="Assign to agent">
      <form onSubmit={submit} className="space-y-4">
        {hasIds && hasEmail && (
          <div className="space-y-2 text-sm text-slate-700">
            <label className="flex items-start gap-2.5">
              <input
                type="radio"
                checked={scope === "applications"}
                onChange={() => setScope("applications")}
                className="mt-0.5 accent-brand-600"
              />
              This application only
            </label>
            <label className="flex items-start gap-2.5">
              <input
                type="radio"
                checked={scope === "email"}
                onChange={() => setScope("email")}
                className="mt-0.5 accent-brand-600"
              />
              <span>
                Every application from <span className="font-medium text-ink">{applicantEmail}</span>
              </span>
            </label>
          </div>
        )}

        {hasIds && !hasEmail && (
          <p className="text-sm text-slate-600">
            {applicationIds!.length} application{applicationIds!.length === 1 ? "" : "s"} selected.
          </p>
        )}

        <FormField label="Agent" required>
          <select
            className={inputClass}
            value={selection}
            disabled={agents.loading && agents.data === null}
            onChange={(e) => {
              setSelection(e.target.value);
              setError(null);
            }}
          >
            <option value="">Choose an agent...</option>
            {(agents.data ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.code})
              </option>
            ))}
            <option value={NONE}>Unassign (no agent)</option>
          </select>
        </FormField>

        <ErrorNotice message={error ?? agents.error} />

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={buttonClass("ghost")}>
            Cancel
          </button>
          <button type="submit" disabled={busy} className={buttonClass("primary")}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}