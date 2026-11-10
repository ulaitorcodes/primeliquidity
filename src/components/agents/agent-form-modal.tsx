"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createAgent, updateAgent } from "@/lib/api/agents";
import { ApiError } from "@/lib/api/http";
import type { Agent } from "@/lib/api/types";
import { usePrograms } from "@/lib/programs/programs-context";
import { Modal } from "@/components/ui/modal";
import { ErrorNotice } from "@/components/ui/error-notice";
import { buttonClass } from "@/components/ui/button";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";

function FieldBox({
  label,
  error,
  helper,
  children,
}: {
  label: string;
  error?: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      ) : helper ? (
        <p className="mt-1.5 text-xs text-slate-500">{helper}</p>
      ) : null}
    </div>
  );
}

/** Mount it only while open. Pass `agent` to edit, omit it to create. */
export function AgentFormModal({
  agent,
  onClose,
  onSaved,
}: {
  agent?: Agent;
  onClose: () => void;
  onSaved: (agent: Agent) => void;
}) {
  const { programs } = usePrograms();
  const editing = !!agent;

  const [name, setName] = useState(agent?.name ?? "");
  const [email, setEmail] = useState(agent?.email ?? "");
  const [phone, setPhone] = useState(agent?.phone ?? "");
  const [password, setPassword] = useState("");
  const [allowed, setAllowed] = useState<string[]>(agent?.allowedPrograms ?? []);
  const [notes, setNotes] = useState(agent?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleProgram(slug: string) {
    setAllowed((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const local: Record<string, string> = {};
    if (name.trim().length < 2) local.name = "Enter the agent's full name";
    if (!editing && !/^\S+@\S+\.\S+$/.test(email)) local.email = "Enter a valid email address";
    if (!editing && password && password.length < 6)
      local.password = "Password must be at least 6 characters";
    setErrors(local);
    if (Object.keys(local).length) return;

    setLoading(true);
    try {
      const saved = editing
        ? await updateAgent(agent.id, {
            name: name.trim(),
            phone: phone.trim(),
            allowedPrograms: allowed,
            notes: notes.trim(),
          })
        : await createAgent({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim() || undefined,
            password: password || undefined,
            allowedPrograms: allowed,
            notes: notes.trim() || undefined,
          });
      onSaved(saved);
    } catch (err) {
      if (err instanceof ApiError) {
        const fe: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(err.fieldErrors)) if (msgs[0]) fe[key] = msgs[0];
        setErrors(fe);
        setFormError(err.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
      setLoading(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={editing ? "Edit agent" : "New agent"} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldBox label="Full name" error={errors.name}>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
          </FieldBox>
          <FieldBox
            label="Email"
            error={errors.email}
            helper={editing ? "Email can't be changed." : undefined}
          >
            <input
              type="email"
              className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-500`}
              value={email}
              disabled={editing}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FieldBox>
          <FieldBox label="Phone (optional)" error={errors.phone}>
            <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </FieldBox>
          {!editing && (
            <FieldBox
              label="Password (optional)"
              error={errors.password}
              helper="Leave blank to generate a temporary password."
            >
              <input
                type="password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FieldBox>
          )}
        </div>

        <FieldBox
          label="Allowed programs"
          error={errors.allowedPrograms}
          helper="Leave all unchecked to allow every program."
        >
          {programs.length === 0 ? (
            <p className="text-sm text-slate-500">No programs available.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {programs.map((p) => (
                <label
                  key={p.slug}
                  className="flex items-center gap-2.5 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={allowed.includes(p.slug)}
                    onChange={() => toggleProgram(p.slug)}
                    className="h-4 w-4 rounded border-slate-300 accent-brand-600"
                  />
                  {p.name}
                </label>
              ))}
            </div>
          )}
        </FieldBox>

        <FieldBox label="Notes (optional)" error={errors.notes}>
          <textarea
            rows={3}
            className={inputClass}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </FieldBox>

        <ErrorNotice message={formError} />

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className={buttonClass("ghost")}>
            Cancel
          </button>
          <button type="submit" disabled={loading} className={buttonClass("primary")}>
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : editing ? (
              "Save changes"
            ) : (
              "Create agent"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}