import type { Kyc } from "@/lib/api/kyc";
import { formatDateTime, formatDay } from "@/lib/format";
import {
  documentLabels,
  employmentOptions,
  idTypeOptions,
  optionLabel,
} from "@/lib/kyc-options";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm text-ink">{value || "—"}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="mb-4 font-semibold text-ink">{title}</h3>
      <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

export function KycDetails({ kyc }: { kyc: Kyc }) {
  const works = kyc.employmentStatus === "employed" || kyc.employmentStatus === "self_employed";

  return (
    <div className="space-y-4">
      <Section title="Personal details">
        <Row label="Full legal name" value={kyc.legalName} />
        <Row label="Date of birth" value={kyc.dateOfBirth ? formatDay(kyc.dateOfBirth) : null} />
        <Row label="Phone number" value={kyc.phone} />
        <div className="sm:col-span-2">
          <Row label="Home address" value={kyc.address} />
        </div>
      </Section>

      <Section title="Identity">
        <Row label="BVN" value={kyc.bvnMasked} />
        <Row label="NIN" value={kyc.ninMasked} />
        <Row label="ID type" value={optionLabel(idTypeOptions, kyc.idType)} />
        <Row label="ID number" value={kyc.idNumberMasked} />
        <Row label="ID expiry" value={kyc.idExpiry ? formatDay(kyc.idExpiry) : null} />
      </Section>

      <Section title="Work">
        <Row label="Employment status" value={optionLabel(employmentOptions, kyc.employmentStatus)} />
        {works && (
          <>
            <Row label="Employer" value={kyc.employerName} />
            <Row label="Job title" value={kyc.jobTitle} />
            <Row label="Employer address" value={kyc.employerAddress} />
          </>
        )}
      </Section>

      <Section title="Next of kin">
        <Row label="Name" value={kyc.nextOfKinName} />
        <Row label="Phone" value={kyc.nextOfKinPhone} />
        <Row label="Relationship" value={kyc.nextOfKinRelationship} />
        <Row label="Consent" value={kyc.consentGiven ? "Given" : "Not given"} />
      </Section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="mb-4 font-semibold text-ink">Documents</h3>
        {kyc.documents.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing uploaded yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {kyc.documents.map((d) => (
              <li key={d.kind} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span className="font-medium text-ink">{documentLabels[d.kind] ?? d.kind}</span>
                <span className="text-xs text-slate-500">
                  {d.capturedLive ? "Captured live · " : ""}
                  uploaded {formatDateTime(d.uploadedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}