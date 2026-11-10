export const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-slate-50 disabled:text-slate-500";

export function FormField({
  label,
  error,
  helper,
  required,
  children,
}: {
  label: string;
  error?: string;
  helper?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-red-600">{error}</p>
      ) : helper ? (
        <p className="mt-1.5 text-xs text-slate-500">{helper}</p>
      ) : null}
    </div>
  );
}