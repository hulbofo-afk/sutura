import Image from "next/image";
import { ArrowUpRight, Clock3, FolderOpen, Sparkles, Users } from "lucide-react";
import { NewCollectionButton } from "@/components/dashboard-shell";

const metrics = [
  { label: "Collections", value: "03", icon: FolderOpen },
  { label: "Réponses reçues", value: "128", icon: Users },
  { label: "Tests actifs", value: "02", icon: Clock3 },
];

export default function DashboardPage() {
  return <div className="space-y-10">
    <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-framboise">Mardi 27 août 2026</p><h1 className="display-font mt-2 text-5xl font-semibold leading-none text-prune sm:text-6xl">Bonjour, Samsiath.</h1><p className="mt-3 text-sm text-prune/60">Ton atelier avance bien. Voici où tu en es.</p></div>
      <NewCollectionButton />
    </header>
    <section className="grid gap-4 sm:grid-cols-3">{metrics.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-[20px] border border-line bg-white p-5"><Icon className="h-5 w-5 text-framboise" /><p className="mt-7 text-xs font-semibold text-prune/55">{label}</p><p className="mt-1 text-3xl font-bold text-prune">{value}</p></div>)}</section>
    <section className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
      <div className="overflow-hidden rounded-[20px] bg-prune p-7 text-white sm:p-9"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-jaune">Prochaine étape</p><h2 className="display-font mt-4 max-w-md text-4xl font-semibold leading-none">Fais parler ta collection.</h2><p className="mt-4 max-w-sm text-sm leading-6 text-white/65">Crée un test rapide et découvre les modèles qui donnent envie.</p></div><Sparkles className="h-6 w-6 text-jaune" /></div><a href="/collections/new" className="mt-8 inline-flex items-center rounded-[14px] bg-jaune px-5 py-3 text-sm font-bold text-prune">Créer un test <ArrowUpRight className="ml-2 h-4 w-4" /></a></div>
      <div className="relative min-h-[260px] overflow-hidden rounded-[20px] bg-rose-pale"><Image src="/brand/tissu.jpg" alt="Texture textile" fill className="object-cover opacity-65 mix-blend-multiply" /><div className="absolute inset-0 bg-gradient-to-t from-prune/80 to-transparent" /><div className="absolute bottom-6 left-6 text-white"><p className="text-xs font-bold uppercase tracking-[0.2em] text-jaune">Inspiration</p><p className="display-font mt-2 text-3xl font-semibold">Chaque détail compte.</p></div></div>
    </section>
  </div>;
}
