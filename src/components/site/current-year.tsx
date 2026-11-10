"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** Renders the current year in the browser only, so server prerendering never calls new Date(). */
export function CurrentYear() {
  const year = useSyncExternalStore(
    subscribe,
    () => new Date().getFullYear(),
    () => null
  );
  return <>{year}</>;
}