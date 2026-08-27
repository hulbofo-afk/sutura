import Image from "next/image";
import { ArrowUpRight, Check, Sparkles } from "lucide-react";

const steps = [
  "Présente tes modèles",
  "Pose les bonnes questions",
  "Décide avec les réponses",
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 sm:px-8 lg:px-10">
        <Image src="/brand/wordmark-framboise.png" alt="Sutura" width={116} height={36} priority />
        <a href="#atelier" className="hidden text-sm font-semibold text-prune transition hover:text-framboise sm:block">
          Découvrir l&apos;atelier <ArrowUpRight className="ml-1 inline h-4 w-4" />
        </a>
        <a href="#atelier" aria-label="Découvrir l'atelier" className="flex h-11 w-11 items-center justify-center rounded-full bg-framboise text-white sm:hidden">
          <ArrowUpRight className="h-5 w-5" />
        </a>
      </nav>

      <section className="mx-auto grid w-full max-w-6xl gap-12 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-10 lg:pb-28 lg:pt-20">
        <div className="relative z-10">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-prune">
            <Sparkles className="h-3.5 w-3.5 text-framboise" /> Atelier de décisions
          </div>
          <h1 className="display-font max-w-xl text-6xl font-semibold leading-[.92] tracking-[-.035em] text-prune sm:text-7xl lg:text-[92px]">
            Tissu, coupe,<br /><span className="text-framboise">décision.</span>
          </h1>
          <p className="mt-7 max-w-md text-base leading-7 text-prune/70 sm:text-lg">
            Teste tes collections auprès de ton audience avant de produire. Sutura transforme les retours en décisions claires.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href="#atelier" className="inline-flex h-[52px] items-center justify-center rounded-[14px] bg-framboise px-6 text-sm font-bold text-white shadow-[0_12px_24px_rgba(233,0,70,.18)] transition hover:-translate-y-0.5 hover:bg-[#c9003d]">
              Créer mon atelier <ArrowUpRight className="ml-2 h-4 w-4" />
            </a>
            <a href="#comment" className="inline-flex h-[52px] items-center justify-center rounded-[14px] border border-line bg-white px-6 text-sm font-bold text-prune transition hover:border-prune/30">
              Comment ça marche ?
            </a>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[520px]">
          <div className="absolute -right-4 -top-5 h-24 w-24 rounded-full bg-jaune sm:-right-8 sm:-top-8 sm:h-32 sm:w-32" />
          <div className="relative overflow-hidden rounded-[28px] bg-prune p-3 shadow-[0_24px_60px_rgba(74,38,48,.2)]">
            <Image src="/brand/hero-visual.jpg" alt="Textile et création de mode" width={720} height={840} className="h-[430px] w-full rounded-[20px] object-cover sm:h-[540px]" priority />
            <div className="absolute bottom-8 left-8 right-8 rounded-[18px] bg-white/95 p-4 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-framboise">La boucle Sutura</p>
              <p className="mt-1 display-font text-2xl font-semibold text-prune">Créer avec confiance.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="comment" className="border-y border-line bg-white">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:px-10 lg:py-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-framboise">Simple comme un atelier</p>
            <h2 className="display-font mt-3 max-w-sm text-5xl font-semibold leading-none text-prune">Moins de doutes. Plus de pièces justes.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step} className="rounded-[20px] bg-canvas p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-pale text-sm font-bold text-framboise">0{index + 1}</div>
                <h3 className="mt-8 text-sm font-bold leading-5 text-prune">{step}</h3>
                <Check className="mt-5 h-4 w-4 text-success" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="atelier" className="mx-auto flex w-full max-w-6xl flex-col items-start gap-8 px-5 py-16 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10 lg:py-24">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-framboise">Ton espace créateur</p>
          <h2 className="display-font mt-3 text-5xl font-semibold leading-none text-prune">Prêt à faire tester<br />ta prochaine collection ?</h2>
        </div>
        <a href="mailto:bonjour@sutura.app" className="inline-flex h-[52px] items-center justify-center rounded-[14px] bg-prune px-6 text-sm font-bold text-white transition hover:bg-framboise">Commencer maintenant <ArrowUpRight className="ml-2 h-4 w-4" /></a>
      </section>

      <footer className="border-t border-line px-5 py-6 text-center text-xs text-prune/50 sm:px-8">Sutura — L&apos;atelier de décisions des créateurs.</footer>
    </main>
  );
}
