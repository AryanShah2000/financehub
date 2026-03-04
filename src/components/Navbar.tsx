"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-sage bg-eerie">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <span className="text-sm font-medium tracking-wide text-sage">
            Dashboard
          </span>
        </div>

        <Link href="/" className="text-xl font-bold tracking-tight text-ivory">
          MyFintel
        </Link>
      </div>
    </nav>
  );
}
