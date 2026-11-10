"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { buttonClass } from "@/components/ui/button";

const links = [
  { href: "/programs", label: "Programs" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#contact", label: "Contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-slate-600 hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className={buttonClass("ghost")}>
            Log in
          </Link>
          <Link href="/programs" className={buttonClass("primary")}>
            Apply now
          </Link>
        </div>

        <button
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 bg-white px-4 pb-4 md:hidden">
          <nav className="flex flex-col py-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex gap-2 pt-2">
            <Link href="/login" className={buttonClass("outline", "md", "flex-1")}>
              Log in
            </Link>
            <Link href="/programs" className={buttonClass("primary", "md", "flex-1")}>
              Apply now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}