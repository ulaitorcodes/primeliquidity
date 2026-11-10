"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/error-notice";

const MAX_BYTES = 5 * 1024 * 1024;

function cameraErrorMessage(err: unknown) {
  const name = err instanceof DOMException ? err.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Camera access was blocked. Allow the camera for this site in your browser settings, then try again.";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return "No camera was found on this device.";
  }
  if (name === "NotReadableError") {
    return "The camera is being used by another app. Close it and try again.";
  }
  return "Couldn't open the camera. Please try again.";
}

export function LiveCamera({
  onUse,
  disabled = false,
}: {
  /** Upload the captured photo. Throw to show an error and let the person retry. */
  onUse: (blob: Blob) => Promise<void>;
  disabled?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const shotUrlRef = useRef<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "starting" | "live" | "captured">("idle");
  const [shot, setShot] = useState<{ blob: Blob; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      stopStream();
      if (shotUrlRef.current) URL.revokeObjectURL(shotUrlRef.current);
    };
  }, [stopStream]);

  // Attach the stream once the <video> element exists
  useEffect(() => {
    if (phase !== "live") return;
    const video = videoRef.current;
    if (video && streamRef.current) {
      video.srcObject = streamRef.current;
      void video.play().catch(() => undefined);
    }
  }, [phase]);

  function discardShot() {
    if (shotUrlRef.current) {
      URL.revokeObjectURL(shotUrlRef.current);
      shotUrlRef.current = null;
    }
    setShot(null);
  }

  async function start() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        "This browser can't open the camera. Use an up-to-date browser, and make sure the page is opened over HTTPS."
      );
      return;
    }
    setPhase("starting");
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      setPhase("live");
    } catch (err) {
      setError(cameraErrorMessage(err));
      setPhase("idle");
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setError("The camera isn't ready yet. Wait a moment and try again.");
      return;
    }
    const scale = Math.min(1, 1280 / video.videoWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setError("Couldn't capture the photo. Please try again.");
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Couldn't capture the photo. Please try again.");
          return;
        }
        if (blob.size > MAX_BYTES) {
          setError("The photo is too large (over 5 MB). Please try again.");
          return;
        }
        discardShot();
        const url = URL.createObjectURL(blob);
        shotUrlRef.current = url;
        setShot({ blob, url });
        stopStream();
        setPhase("captured");
      },
      "image/jpeg",
      0.9
    );
  }

  async function retake() {
    discardShot();
    await start();
  }

  async function use() {
    if (!shot) return;
    setUploading(true);
    setError(null);
    try {
      await onUse(shot.blob);
      discardShot();
      setPhase("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      {phase === "idle" && (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
          <Camera className="mx-auto text-slate-400" size={32} />
          <p className="mt-3 text-sm text-slate-600">
            This photo must be taken now. Uploading from the gallery isn't allowed.
          </p>
          <button
            type="button"
            onClick={start}
            disabled={disabled}
            className={buttonClass("primary", "md", "mt-4")}
          >
            Open camera
          </button>
        </div>
      )}

      {phase === "starting" && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 p-10 text-sm text-slate-600">
          <Loader2 size={16} className="animate-spin" /> Opening the camera...
        </div>
      )}

      {phase === "live" && (
        <div className="space-y-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full max-w-md rounded-xl bg-black"
            style={{ transform: "scaleX(-1)" }}
          />
          <button type="button" onClick={capture} className={buttonClass("primary")}>
            <Camera size={16} /> Take photo
          </button>
        </div>
      )}

      {phase === "captured" && shot && (
        <div className="space-y-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={shot.url}
            alt="Your captured photo"
            className="w-full max-w-md rounded-xl border border-slate-200"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={retake}
              disabled={uploading}
              className={buttonClass("outline")}
            >
              Retake
            </button>
            <button
              type="button"
              onClick={use}
              disabled={uploading || disabled}
              className={buttonClass("primary")}
            >
              {uploading ? <Loader2 size={16} className="animate-spin" /> : "Use this photo"}
            </button>
          </div>
        </div>
      )}

      <ErrorNotice message={error} />
    </div>
  );
}