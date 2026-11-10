"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Info, Loader2, TriangleAlert } from "lucide-react";
import {
  getKycProfile,
  patchKyc,
  submitKyc,
  uploadKycDocument,
  type Kyc,
  type KycDocumentKind,
  type KycPatch,
} from "@/lib/api/kyc";
import { ApiError } from "@/lib/api/http";
import { formatDateTime, todayISO } from "@/lib/format";
import {
  documentLabels,
  employmentOptions,
  idTypeOptions,
  kycStatusLabels,
  missingLabel,
  type Option,
} from "@/lib/kyc-options";
import { KycDetails } from "@/components/kyc/kyc-details";
import { KycImage } from "@/components/kyc/kyc-image";
import { KycStatusBadge } from "@/components/kyc/kyc-status-badge";
import { LiveCamera } from "@/components/kyc/live-camera";
import { buttonClass } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/error-notice";
import { FormField, inputClass } from "@/components/ui/form-field";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "personal", title: "Personal details" },
  { id: "identity", title: "Identity numbers" },
  { id: "idcard", title: "ID card" },
  { id: "photo", title: "Live photo" },
  { id: "work", title: "Work" },
  { id: "kin", title: "Next of kin" },
  { id: "consent", title: "Consent" },
  { id: "review", title: "Review" },
] as const;

type StepId = (typeof STEPS)[number]["id"];
type Values = Record<string, string>;

interface FieldDef {
  name: string;
  label: string;
  kind: "text" | "date" | "tel" | "textarea" | "select" | "digits";
  required?: boolean;
  helper?: string;
  placeholder?: string;
  options?: Option[];
  full?: boolean;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

function valuesFrom(k: Kyc): Values {
  // BVN, NIN and ID number only come back masked, so they start empty
  return {
    legalName: k.legalName ?? "",
    dateOfBirth: k.dateOfBirth?.slice(0, 10) ?? "",
    phone: k.phone ?? "",
    address: k.address ?? "",
    bvn: "",
    nin: "",
    idType: k.idType ?? "",
    idNumber: "",
    idExpiry: k.idExpiry?.slice(0, 10) ?? "",
    employmentStatus: k.employmentStatus ?? "",
    employerName: k.employerName ?? "",
    employerAddress: k.employerAddress ?? "",
    jobTitle: k.jobTitle ?? "",
    nextOfKinName: k.nextOfKinName ?? "",
    nextOfKinPhone: k.nextOfKinPhone ?? "",
    nextOfKinRelationship: k.nextOfKinRelationship ?? "",
  };
}

function stepFields(id: StepId, kyc: Kyc, values: Values): FieldDef[] {
  switch (id) {
    case "personal":
      return [
        { name: "legalName", label: "Full legal name", kind: "text", required: true, helper: "Exactly as it appears on your ID." },
        { name: "dateOfBirth", label: "Date of birth", kind: "date", required: true },
        { name: "phone", label: "Phone number", kind: "tel", required: true, placeholder: "080..." },
        { name: "address", label: "Home address", kind: "textarea", required: true, full: true },
      ];
    case "identity":
      return [
        {
          name: "bvn",
          label: "BVN",
          kind: "digits",
          required: !kyc.bvnMasked,
          helper: kyc.bvnMasked ? `Saved: ${kyc.bvnMasked}. Enter it again only to change it.` : "11 digits",
        },
        {
          name: "nin",
          label: "NIN",
          kind: "digits",
          required: !kyc.ninMasked,
          helper: kyc.ninMasked ? `Saved: ${kyc.ninMasked}. Enter it again only to change it.` : "11 digits",
        },
      ];
    case "idcard":
      return [
        { name: "idType", label: "ID type", kind: "select", required: true, options: idTypeOptions },
        {
          name: "idNumber",
          label: "ID number",
          kind: "text",
          required: !kyc.idNumberMasked,
          helper: kyc.idNumberMasked ? `Saved: ${kyc.idNumberMasked}. Enter it again only to change it.` : undefined,
        },
        { name: "idExpiry", label: "ID expiry date (if it has one)", kind: "date" },
      ];
    case "work": {
      const works = values.employmentStatus === "employed" || values.employmentStatus === "self_employed";
      return [
        { name: "employmentStatus", label: "Employment status", kind: "select", required: true, options: employmentOptions, full: !works },
        ...(works
          ? ([
              { name: "employerName", label: "Employer or business name", kind: "text", required: true },
              { name: "jobTitle", label: "Job title", kind: "text", required: true },
              { name: "employerAddress", label: "Work address", kind: "textarea", required: true, full: true },
            ] as FieldDef[])
          : []),
      ];
    }
    case "kin":
      return [
        { name: "nextOfKinName", label: "Full name", kind: "text", required: true },
        { name: "nextOfKinPhone", label: "Phone number", kind: "tel", required: true },
        { name: "nextOfKinRelationship", label: "Relationship", kind: "text", required: true, placeholder: "e.g. Sister" },
      ];
    default:
      return [];
  }
}

function validateFields(fields: FieldDef[], values: Values) {
  const errs: Record<string, string> = {};
  for (const f of fields) {
    const v = (values[f.name] ?? "").trim();
    if (!v) {
      if (f.required) errs[f.name] = `${f.label} is required`;
      continue;
    }
    if (f.kind === "digits" && !/^\d{11}$/.test(v)) errs[f.name] = `${f.label} must be exactly 11 digits`;
    if (f.kind === "tel" && v.replace(/\D/g, "").length < 10) errs[f.name] = "Enter a valid phone number";
    if (f.name === "dateOfBirth" && v > todayISO()) errs[f.name] = "Date of birth can't be in the future";
    if (f.name === "legalName" && v.length < 2) errs[f.name] = "Enter your full legal name";
  }
  return errs;
}

function FieldInput({
  f,
  value,
  error,
  disabled,
  onChange,
}: {
  f: FieldDef;
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className={cn(f.full && "sm:col-span-2")}>
      <FormField label={f.label} required={f.required} error={error} helper={f.helper}>
        {f.kind === "textarea" ? (
          <textarea
            rows={3}
            className={inputClass}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : f.kind === "select" ? (
          <select
            className={inputClass}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">Select...</option>
            {f.options?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={f.kind === "date" ? "date" : f.kind === "tel" ? "tel" : "text"}
            inputMode={f.kind === "digits" ? "numeric" : undefined}
            maxLength={f.kind === "digits" ? 11 : undefined}
            autoComplete={f.kind === "digits" ? "off" : undefined}
            className={inputClass}
            value={value}
            disabled={disabled}
            placeholder={f.placeholder}
            max={f.name === "dateOfBirth" ? todayISO() : undefined}
            onChange={(e) =>
              onChange(f.kind === "digits" ? e.target.value.replace(/\D/g, "") : e.target.value)
            }
          />
        )}
      </FormField>
    </div>
  );
}

function DocumentUpload({
  kycRef,
  kind,
  help,
  required,
  uploadedAt,
  canView,
  version,
  disabled,
  error,
  onUpload,
}: {
  kycRef: string;
  kind: KycDocumentKind;
  help?: string;
  required: boolean;
  uploadedAt: string | null;
  canView: boolean;
  version: number;
  disabled: boolean;
  error?: string;
  onUpload: (file: File) => Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLocalError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setLocalError("Use a JPEG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setLocalError("The image is too large. The limit is 5 MB.");
      return;
    }
    setUploading(true);
    try {
      await onUpload(file);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  const shownError = localError ?? error;

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink">{documentLabels[kind]}</p>
          {help && <p className="mt-0.5 text-xs text-slate-500">{help}</p>}
          <p className="mt-1.5 text-xs">
            {uploadedAt ? (
              <span className="font-medium text-emerald-700">Uploaded {formatDateTime(uploadedAt)}</span>
            ) : required ? (
              <span className="font-medium text-amber-700">Required</span>
            ) : (
              <span className="text-slate-500">Optional</span>
            )}
          </p>
        </div>
        <label
          className={cn(
            buttonClass("outline"),
            (disabled || uploading) && "pointer-events-none opacity-50"
          )}
        >
          <input
            type="file"
            accept={ALLOWED_TYPES.join(",")}
            className="sr-only"
            disabled={disabled || uploading}
            onChange={handleFile}
          />
          {uploading ? <Loader2 size={16} className="animate-spin" /> : uploadedAt ? "Replace" : "Upload"}
        </label>
      </div>

      {uploadedAt && canView && (
        <KycImage
          kycRef={kycRef}
          kind={kind}
          version={version}
          alt={documentLabels[kind]}
          className="mt-3 max-h-48"
        />
      )}

      {shownError && <p className="mt-2 text-xs text-red-600">{shownError}</p>}
    </div>
  );
}

function StatusNote({ kyc }: { kyc: Kyc }) {
  const base = "flex items-start gap-3 rounded-2xl border p-4 text-sm";

  if (kyc.status === "approved") {
    return (
      <div className={cn(base, "border-emerald-200 bg-emerald-50 text-emerald-900")}>
        <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
        <p>Identity verification is approved.</p>
      </div>
    );
  }
  if (kyc.status === "submitted") {
    return (
      <div className={cn(base, "border-amber-200 bg-amber-50 text-amber-900")}>
        <Info size={18} className="mt-0.5 shrink-0" />
        <p>
          Submitted{kyc.submittedAt ? ` on ${formatDateTime(kyc.submittedAt)}` : ""} and waiting for review. The
          details can't be changed meanwhile.
        </p>
      </div>
    );
  }
  if (kyc.status === "changes_requested") {
    return (
      <div className={cn(base, "border-orange-200 bg-orange-50 text-orange-900")}>
        <TriangleAlert size={18} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold">Changes are needed</p>
          <p className="mt-1 whitespace-pre-line">{kyc.reviewNote || "The reviewer didn't leave a note."}</p>
        </div>
      </div>
    );
  }
  if (kyc.status === "rejected") {
    return (
      <div className={cn(base, "border-red-200 bg-red-50 text-red-900")}>
        <TriangleAlert size={18} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold">Verification was rejected</p>
          <p className="mt-1 whitespace-pre-line">{kyc.reviewNote || "No reason was recorded."}</p>
        </div>
      </div>
    );
  }
  return (
    <div className={cn(base, "border-slate-200 bg-white text-slate-700")}>
      <Info size={18} className="mt-0.5 shrink-0" />
      <p>
        Complete the steps below. Your progress is saved at every step, so you can leave and come back. Status:{" "}
        {kycStatusLabels[kyc.status]}.
      </p>
    </div>
  );
}

export function KycWizard({
  kycRef,
  canViewDocuments,
  onBehalf = false,
  onSubmitted,
}: {
  /** "me" or a profile id */
  kycRef: string;
  /** Only the person and admins can view the images, not agents */
  canViewDocuments: boolean;
  /** An agent filling it in for someone else */
  onBehalf?: boolean;
  onSubmitted?: () => void;
}) {
  const toast = useToast();
  const [kyc, setKyc] = useState<Kyc | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [values, setValues] = useState<Values>({});
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [version, setVersion] = useState(0);
  const [retaking, setRetaking] = useState(false);
  const [submitMissing, setSubmitMissing] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    getKycProfile(kycRef)
      .then((k) => {
        if (cancelled) return;
        setKyc(k);
        setValues(valuesFrom(k));
        setConsent(k.consentGiven);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Couldn't load the KYC form");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kycRef]);

  const refresh = useCallback(async () => {
    const k = await getKycProfile(kycRef);
    setKyc(k);
    setVersion((v) => v + 1);
    return k;
  }, [kycRef]);

  function setValue(name: string, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  function handleSaveError(err: unknown) {
    if (err instanceof ApiError) {
      const fe: Record<string, string> = {};
      for (const [key, msgs] of Object.entries(err.fieldErrors)) {
        if (!msgs[0]) continue;
        fe[key] =
          key === "bvn" || key === "nin"
            ? `${msgs[0]} If this number is yours, please contact support.`
            : msgs[0];
      }
      setErrors(fe);
      setFormError(err.message);
    } else {
      setFormError("Something went wrong. Please try again.");
    }
  }

  async function uploadFile(kind: KycDocumentKind, file: File) {
    await uploadKycDocument(kycRef, kind, file, file.name);
    await refresh();
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`doc:${kind}`];
      return next;
    });
  }

  async function uploadSelfie(blob: Blob) {
    await uploadKycDocument(kycRef, "selfie", blob, "selfie.jpg", true);
    await refresh();
    setRetaking(false);
    setErrors((prev) => {
      const next = { ...prev };
      delete next["doc:selfie"];
      return next;
    });
  }

  async function goNext() {
    if (!kyc) return;
    setFormError(null);
    const step = STEPS[stepIdx].id;
    const fields = stepFields(step, kyc, values);
    const errs = validateFields(fields, values);
    if (step === "consent" && !consent) errs.consent = "You need to agree before continuing";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      const patch: KycPatch = {};
      for (const f of fields) {
        const v = (values[f.name] ?? "").trim();
        if (v) patch[f.name] = v;
      }
      if (step === "consent") patch.consent = true;

      let current = kyc;
      if (Object.keys(patch).length > 0) {
        current = await patchKyc(kycRef, patch);
        setKyc(current);
      }

      // What is required depends on the saved ID type, so check after saving
      const gate: Record<string, string> = {};
      if (step === "idcard") {
        for (const k of ["id_front", "id_back", "proof_of_address"] as const) {
          if (current.missing.includes(`document:${k}`)) {
            gate[`doc:${k}`] = `Upload the ${documentLabels[k]} to continue`;
          }
        }
      }
      if (step === "photo" && current.missing.includes("document:selfie")) {
        gate["doc:selfie"] = "Take a live photo to continue";
      }
      if (Object.keys(gate).length) {
        setErrors(gate);
        return;
      }

      setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      handleSaveError(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    setFormError(null);
    setSubmitMissing([]);
    setSaving(true);
    try {
      const result = await submitKyc(kycRef);
      setKyc(result);
      toast.success("Submitted for review");
      onSubmitted?.();
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitMissing(err.fieldErrors.missing ?? []);
        setFormError(err.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (!kyc) return <ErrorNotice message={loadError ?? "KYC not found."} />;

  /* ---- read-only ---- */
  if (!kyc.editable) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <KycStatusBadge status={kyc.status} />
          <span className="text-sm text-slate-600">{kyc.email}</span>
        </div>
        <StatusNote kyc={kyc} />
        <KycDetails kyc={kyc} />
      </div>
    );
  }

  const step = STEPS[stepIdx];
  const isLast = stepIdx === STEPS.length - 1;
  const fields = stepFields(step.id, kyc, values);
  const doc = (kind: KycDocumentKind) => kyc.documents.find((d) => d.kind === kind) ?? null;
  const selfie = doc("selfie");
  const missingNow = submitMissing.length > 0 ? submitMissing : kyc.missing;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <KycStatusBadge status={kyc.status} />
        <span className="text-sm text-slate-600">{kyc.email}</span>
      </div>

      <StatusNote kyc={kyc} />

      {/* Stepper */}
      <div>
        <ol className="flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <li key={s.id} className="flex flex-1 items-center gap-1.5">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  i <= stepIdx ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-500"
                )}
              >
                {i + 1}
              </span>
              {i < STEPS.length - 1 && (
                <span className={cn("h-px flex-1", i < stepIdx ? "bg-brand-600" : "bg-slate-200")} />
              )}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">
          Step {stepIdx + 1} of {STEPS.length}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-xl font-semibold text-ink">{step.title}</h2>
          {kyc.id !== null && !isLast && (
            <button
              type="button"
              onClick={() => setStepIdx(STEPS.length - 1)}
              className="text-sm font-medium text-brand-700 hover:underline"
            >
              Jump to review
            </button>
          )}
        </div>

        {step.id === "identity" && (
          <p className="mt-1 text-sm text-slate-600">
            After you save them, only the last digits are ever shown back to you.
          </p>
        )}

        {fields.length > 0 && (
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {fields.map((f) => (
              <FieldInput
                key={f.name}
                f={f}
                value={values[f.name] ?? ""}
                error={errors[f.name]}
                disabled={saving}
                onChange={(v) => setValue(f.name, v)}
              />
            ))}
          </div>
        )}

        {step.id === "idcard" && (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-slate-600">
              Upload clear photos of the ID. JPEG, PNG or WebP, up to 5 MB each.
            </p>
            {(
              [
                ["id_front", "The side with your photo."],
                ["id_back", undefined],
                ["proof_of_address", "A recent utility bill or bank statement."],
              ] as const
            ).map(([kind, help]) => (
              <DocumentUpload
                key={kind}
                kycRef={kycRef}
                kind={kind}
                help={help}
                required={kyc.missing.includes(`document:${kind}`)}
                uploadedAt={doc(kind)?.uploadedAt ?? null}
                canView={canViewDocuments}
                version={version}
                disabled={saving}
                error={errors[`doc:${kind}`]}
                onUpload={(file) => uploadFile(kind, file)}
              />
            ))}
          </div>
        )}

        {step.id === "photo" && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-slate-600">
              {onBehalf
                ? "Take the applicant's photo now, with their face clearly visible. It must be taken live."
                : "Take a clear photo of your face now. It must be taken live with your camera."}
            </p>

            {selfie && !retaking ? (
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-medium text-emerald-700">
                  Photo uploaded {formatDateTime(selfie.uploadedAt)}
                </p>
                {canViewDocuments && (
                  <KycImage
                    kycRef={kycRef}
                    kind="selfie"
                    version={version}
                    alt="Your live photo"
                    className="mt-3 max-h-56"
                  />
                )}
                <button
                  type="button"
                  onClick={() => setRetaking(true)}
                  className={buttonClass("outline", "md", "mt-3")}
                >
                  Retake photo
                </button>
              </div>
            ) : (
              <>
                <LiveCamera onUse={uploadSelfie} disabled={saving} />
                {selfie && (
                  <button
                    type="button"
                    onClick={() => setRetaking(false)}
                    className="text-sm font-medium text-slate-600 hover:text-ink"
                  >
                    Keep the current photo
                  </button>
                )}
              </>
            )}

            {errors["doc:selfie"] && <p className="text-xs text-red-600">{errors["doc:selfie"]}</p>}
          </div>
        )}

        {step.id === "work" && (
          <p className="mt-1 text-sm text-slate-600">
            Work details are only needed if you're employed or self-employed.
          </p>
        )}

        {step.id === "consent" && (
          <div className="mt-6">
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  setErrors((prev) => ({ ...prev, consent: "" }));
                }}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-brand-600"
              />
              <span>
                {onBehalf
                  ? "The applicant has confirmed that these details are accurate and agrees that Prime Liquidity may verify their identity using the information and documents provided."
                  : "I confirm that these details are accurate, and I agree that Prime Liquidity may verify my identity using the information and documents I've provided."}
              </span>
            </label>
            {errors.consent && <p className="mt-2 text-xs text-red-600">{errors.consent}</p>}
          </div>
        )}

        {step.id === "review" && (
          <div className="mt-6 space-y-5">
            <KycDetails kyc={kyc} />

            {missingNow.length > 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">Still needed before you can submit:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {missingNow.map((m) => (
                    <li key={m}>{missingLabel(m)}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
                Everything is filled in. Check the details above, then submit for review.
              </p>
            )}
          </div>
        )}

        {formError && (
          <div className="mt-6">
            <ErrorNotice message={formError} />
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setStepIdx((i) => Math.max(0, i - 1));
              setFormError(null);
              setErrors({});
            }}
            disabled={stepIdx === 0 || saving}
            className={buttonClass("ghost")}
          >
            <ArrowLeft size={16} /> Back
          </button>

          {isLast ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || !kyc.canSubmit}
              className={buttonClass("primary")}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : "Submit for review"}
            </button>
          ) : (
            <button type="button" onClick={goNext} disabled={saving} className={buttonClass("primary")}>
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  Save and continue <ArrowRight size={16} />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}