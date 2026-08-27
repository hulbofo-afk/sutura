"use client";

import Image from "next/image";
import Link from "next/link";
import { BarChart3, FolderOpen, Home, LogOut, Plus, Settings, TestTube2 } from "lucide-react";
import type { ReactNode } from "react";

const navItems = [
  { href: "/dashboard", label: "Accueil", icon: Home },
  { href: "/collections", label: "Collections", icon: FolderOpen },
  { href: "/fashion-tests", label: "Tests", icon: TestTube2 },
  { href: "/analytics/demo", label: "Analyses", icon: BarChart3 },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas pb-24 lg:pb-0">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link href="/dashboard"><Image src="/brand/wordmark-framboise.png" alt="Sutura" width={108} height={34} /></Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-right sm:block"><strong className="block text-sm text-prune">Samsiath</strong><small className="text-xs text-prune/50">Sutura Studio</small></span>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-prune text-sm font-bold text-white">S</div>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl">
        <aside className="hidden w-52 shrink-0 border-r border-line px-4 py-8 lg:block">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-prune/40">Navigation</p>
          <nav className="mt-4 space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex items-center gap-3 rounded-[14px] px-3 py-3 text-sm font-semibold text-prune/65 transition hover:bg-rose-pale hover:text-framboise"><Icon className="h-4 w-4" />{label}</Link>)}
          </nav>
          <div className="mt-10 border-t border-line pt-4"><Link href="/profile" className="flex items-center gap-3 rounded-[14px] px-3 py-3 text-sm font-semibold text-prune/65 hover:bg-rose-pale"><Settings className="h-4 w-4" />Profil</Link><Link href="/" className="flex items-center gap-3 rounded-[14px] px-3 py-3 text-sm font-semibold text-prune/65 hover:bg-rose-pale"><LogOut className="h-4 w-4" />Quitter</Link></div>
        </aside>
        <main className="w-full min-w-0 px-5 py-8 sm:px-8 lg:px-10 lg:py-12">{children}</main>
      </div>
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-[76px] items-center justify-around border-t border-line bg-white/95 px-3 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {navItems.slice(0, 4).map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex min-w-[60px] flex-col items-center gap-1 py-2 text-[10px] font-bold text-prune/55"><Icon className="h-5 w-5" />{label}</Link>)}
      </nav>
    </div>
  );
}

export function NewCollectionButton() {
  return <Link href="/collections/new" className="inline-flex h-[52px] items-center justify-center rounded-[14px] bg-framboise px-5 text-sm font-bold text-white shadow-[0_10px_20px_rgba(233,0,70,.16)] hover:bg-[#c9003d]"><Plus className="mr-2 h-4 w-4" />Nouvelle collection</Link>;
}
