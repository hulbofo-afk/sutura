import Image from "next/image";
import { ArrowUpRight, BarChart3, Check, ClipboardCheck, FolderOpen, Sparkles } from "lucide-react";

const steps = [
  {
    icon: FolderOpen,
    title: "Présente tes modèles",
    text: "Photos, croquis, couleurs et prix souhaité : chaque pièce trouve sa place dans ton atelier.",
  },
  {
    icon: ClipboardCheck,
    title: "Pose les bonnes questions",
    text: "Un questionnaire élégant, partageable par simple lien. Ton audience répond sans créer de compte.",
  },
  {
    icon: BarChart3,
    title: "Décide avec les réponses",
    text: "Scores de désirabilité, risques d'invendu et recommandations concrètes pour produire juste.",
  },
];

const highlights = [
  "Test avant de produire",
  "Lien public sans compte",
  "Décisions chiffrées",
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      {/* ————— Navigation ————— */}
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 sm:px-8 lg:px-10">
        <Image src="/brand/wordmark-framboise.png" alt="Sutura" width={116} height={36} priority style={{ width: "auto" }} />
        <div className="flex items-center gap-2 sm:gap-6">
          <a href="#atelier" className="hidden text-sm font-semibold text-prune transition hover:text-framboise sm:block">
            Découvrir l&apos;atelier
          </a>
          <a
            href="/login"
            className="hidden text-sm font-semibold text-prune transition hover:text-framboise sm:block"
          >
            Se connecter
          </a>
          <a
            href="/register"
            className="inline-flex h-11 items-center justify-center rounded-full bg-framboise px-5 text-sm font-bold text-white shadow-framboise transition hover:-translate-y-0.5 hover:bg-framboise-fonce"
          >
            Commencer
          </a>
        </div>
      </nav>

      {/* ————— Hero ————— */}
      <section className="mx-auto grid w-full max-w-6xl gap-12 px-5 pb-20 pt-8 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-10 lg:pb-28 lg:pt-16">
        <div className="relative z-10">
          <div className="anim-rise mb-7 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-2 t-eyebrow text-prune">
            <Sparkles className="h-3.5 w-3.5 text-framboise" /> Atelier de décisions
          </div>
          <h1 className="anim-rise delay-1 t-display-xl max-w-xl text-prune">
            Donne une forme<br />
            à tes <span className="text-framboise">intuitions.</span>
          </h1>
          <p className="anim-rise delay-2 mt-7 max-w-md text-base leading-7 text-prune/70 sm:text-lg">
            Teste tes collections auprès de ton audience avant de produire. Sutura transforme les retours en décisions claires.
          </p>
          <div className="anim-rise delay-3 mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href="/register"
              className="inline-flex h-[52px] items-center justify-center gap-2 rounded-[14px] bg-framboise px-6 text-sm font-bold text-white shadow-framboise transition hover:-translate-y-0.5 hover:bg-framboise-fonce active:translate-y-0"
            >
              Créer mon atelier <ArrowUpRight className="h-4 w-4" />
            </a>
            <a
              href="#comment"
              className="inline-flex h-[52px] items-center justify-center rounded-[14px] border border-line bg-white px-6 text-sm font-bold text-prune transition hover:border-prune/30 hover:-translate-y-0.5"
            >
              Comment ça marche ?
            </a>
          </div>
          <ul className="anim-rise delay-4 mt-10 flex flex-wrap gap-x-6 gap-y-2">
            {highlights.map((highlight) => (
              <li key={highlight} className="flex items-center gap-2 text-xs font-semibold text-prune/60">
                <Check className="h-3.5 w-3.5 text-success" /> {highlight}
              </li>
            ))}
          </ul>
        </div>

        <div className="anim-rise delay-2 relative mx-auto w-full max-w-[520px]">
          <div className="anim-float absolute -right-4 -top-5 h-24 w-24 rounded-full bg-jaune sm:-right-8 sm:-top-8 sm:h-32 sm:w-32" aria-hidden />
          <div className="relative overflow-hidden rounded-[28px] bg-prune p-3 shadow-lift-lg">
            <Image
              src="/brand/hero-visual.jpg"
              alt="Veste de créateur sur portant dans un atelier lumineux"
              width={720}
              height={840}
              className="h-[400px] w-full rounded-[20px] object-cover sm:h-[540px]"
              priority
            />
            <div className="absolute bottom-8 left-8 right-8 rounded-[18px] bg-white/95 p-4 backdrop-blur-sm">
              <p className="t-eyebrow text-framboise">La boucle Sutura</p>
              <p className="display-font mt-1 text-2xl font-semibold text-prune">Créer avec confiance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ————— Comment ça marche ————— */}
      <section id="comment" className="relative border-y border-line bg-white">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="t-eyebrow text-framboise">Simple comme un atelier</p>
              <h2 className="t-display-lg mt-4 max-w-sm text-prune">
                Moins de doutes.<br />Plus de pièces <span className="text-framboise">justes.</span>
              </h2>
              <div className="stitch-line mt-8 w-24" aria-hidden />
              <p className="mt-8 max-w-xs text-sm leading-6 text-prune/60">
                Trois gestes suffisent pour passer de l&apos;intuition à la décision. Le reste, Sutura le tisse pour toi.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {steps.map(({ icon: Icon, title, text }, index) => (
                <article
                  key={title}
                  className="card-hover group rounded-[20px] border border-line bg-canvas p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-rose-pale text-framboise transition group-hover:bg-framboise group-hover:text-white">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="display-font text-3xl font-semibold text-line transition group-hover:text-framboise/30">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-8 text-sm font-bold leading-5 text-prune">{title}</h3>
                  <p className="mt-2 text-[13px] leading-5 text-prune/55">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ————— Preuve produit : résultats ————— */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="relative order-2 lg:order-1">
            <div className="absolute -left-6 -bottom-6 h-28 w-28 rounded-full bg-rose-pale" aria-hidden />
            <div className="relative rounded-[24px] border border-line bg-white p-6 shadow-lift sm:p-8">
              <p className="t-eyebrow text-prune/45">Aperçu résultats</p>
              <p className="mt-4 text-sm font-bold text-prune">Q1. Quel motif préférez-vous ?</p>
              <div className="mt-6 space-y-4">
                {[
                  { label: "Géométrique", value: 32, color: "bg-framboise" },
                  { label: "Floral", value: 28, color: "bg-framboise-douce" },
                  { label: "Abstrait", value: 22, color: "bg-rose-pale" },
                  { label: "Rayé", value: 18, color: "bg-jaune" },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex items-center justify-between text-xs font-semibold text-prune/70">
                      <span>{row.label}</span>
                      <span className="text-prune">{row.value}%</span>
                    </div>
                    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-canvas">
                      <div className={`h-full rounded-full ${row.color}`} style={{ width: `${row.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-[14px] bg-rose-clair p-4">
                <p className="flex items-center gap-2 text-xs font-bold text-prune">
                  <Sparkles className="h-3.5 w-3.5 text-framboise" /> Insight clé
                </p>
                <p className="mt-1.5 text-[13px] leading-5 text-prune/70">
                  Les motifs géométriques sont les plus appréciés. À explorer pour ta prochaine collection.
                </p>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <p className="t-eyebrow text-framboise">Des réponses qui parlent</p>
            <h2 className="t-display-lg mt-4 text-prune">
              Chaque retour devient<br />une <span className="text-framboise">décision.</span>
            </h2>
            <p className="mt-6 max-w-md text-base leading-7 text-prune/70">
              Scores de désirabilité, risque d&apos;invendu et recommandations actionnables : tu sais exactement quoi produire, en quelle quantité, et à quel prix.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4">
              {[
                { value: "87", label: "Désirabilité /100" },
                { value: "92%", label: "Complétion" },
                { value: "4m", label: "Temps moyen" },
              ].map((metric) => (
                <div key={metric.label} className="rounded-[16px] border border-line bg-white p-4">
                  <p className="display-font text-3xl font-semibold text-framboise">{metric.value}</p>
                  <p className="mt-1 text-[11px] font-semibold leading-4 text-prune/55">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ————— CTA final ————— */}
      <section id="atelier" className="relative overflow-hidden bg-prune">
        <div className="grain absolute inset-0" aria-hidden />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-framboise/20 blur-3xl" aria-hidden />
        <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-jaune/10 blur-3xl" aria-hidden />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-start gap-10 px-5 py-20 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10 lg:py-28">
          <div>
            <p className="t-eyebrow text-jaune">Ton espace créateur</p>
            <h2 className="t-display-lg mt-4 max-w-lg text-white">
              Prête à faire tester<br />ta prochaine <span className="text-framboise-douce">collection ?</span>
            </h2>
            <p className="mt-5 max-w-md text-sm leading-6 text-white/60">
              Rejoins les créateurs qui produisent avec confiance, pas avec des doutes.
            </p>
          </div>
          <a
            href="/register"
            className="inline-flex h-[56px] items-center justify-center gap-2 rounded-[16px] bg-jaune px-8 text-sm font-bold text-prune transition hover:-translate-y-0.5 hover:brightness-95 active:translate-y-0"
          >
            Commencer maintenant <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      <footer className="border-t border-line px-5 py-8 sm:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Image src="/brand/wordmark-framboise.png" alt="Sutura" width={88} height={28} style={{ width: "auto" }} />
          <p className="text-xs text-prune/50">L&apos;atelier de décisions des créateurs.</p>
          <a href="mailto:bonjour@sutura.app" className="text-xs font-semibold text-prune/60 transition hover:text-framboise">
            bonjour@sutura.app
          </a>
        </div>
      </footer>
    </main>
  );
}
