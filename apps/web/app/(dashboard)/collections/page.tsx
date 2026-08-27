import Link from "next/link";
import { ArrowUpRight, FolderOpen, Search } from "lucide-react";
import { NewCollectionButton } from "@/components/dashboard-shell";

const collections = [
  { title: "Rose Cotonou", detail: "Rentrée 2026 · 4 modèles", status: "Brouillon", tone: "border-line" },
  { title: "Lumière sur Lagos", detail: "Été 2026 · 8 modèles", status: "Test actif", tone: "border-[#b5dec8]" },
  { title: "Terre rouge", detail: "Archives · 6 modèles", status: "Archivée", tone: "border-line" },
];

export default function CollectionsPage() {
  return <div className="space-y-8"><header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-framboise">Ton atelier</p><h1 className="display-font mt-2 text-5xl font-semibold leading-none text-prune">Collections.</h1><p className="mt-3 text-sm text-prune/60">Gère tes pièces et prépare tes prochains tests.</p></div><NewCollectionButton /></header><div className="flex h-12 items-center gap-3 rounded-[14px] border border-line bg-white px-4"><Search className="h-4 w-4 text-prune/40" /><input placeholder="Rechercher une collection" className="w-full bg-transparent text-sm outline-none placeholder:text-prune/40" /></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{collections.map((collection) => <Link key={collection.title} href="/collections/demo" className={`group rounded-[20px] border bg-white p-5 transition hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(74,38,48,.08)] ${collection.tone}`}><div className="flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-rose-pale"><FolderOpen className="h-5 w-5 text-framboise" /></div><ArrowUpRight className="h-5 w-5 text-prune/35 transition group-hover:text-framboise" /></div><h2 className="mt-8 text-lg font-bold text-prune">{collection.title}</h2><p className="mt-1 text-sm text-prune/55">{collection.detail}</p><span className="mt-6 inline-flex rounded-full bg-canvas px-3 py-1 text-[11px] font-bold text-prune/65">{collection.status}</span></Link>)}</div></div>;
}
