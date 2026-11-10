"use client";

import { useEffect, useState } from "react";
import { fetchKycDocument, type KycDocumentKind } from "@/lib/api/kyc";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * KYC images need the Bearer token, so they are fetched with fetch(),
 * turned into a blob URL, and revoked again when this unmounts.
 */
export function KycImage({
  kycRef,
  kind,
  version = 0,
  alt,
  className,
}: {
  kycRef: string;
  kind: KycDocumentKind;
  /** change it to force a reload (e.g. after a new upload) */
  version?: number;
  alt: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    setUrl(null);
    setError(null);

    fetchKycDocument(kycRef, kind)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load the image");
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [kycRef, kind, version]);

  if (error) {
    return <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">{error}</p>;
  }
  if (!url) return <Skeleton className={cn("h-40 w-full max-w-xs", className)} />;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={alt} className={cn("rounded-lg border border-slate-200", className)} />
  );
}