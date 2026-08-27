"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowRight, Check, ChevronLeft } from "lucide-react";

const questions = [
  { text: "Quel modèle te ressemble le plus ?", options: ["Veste Sika", "Robe Dantokpa", "Ensemble Harmattan"] },
  { text: "Quel prix te semblerait juste ?", options: ["25 000 FCFA", "40 000 FCFA", "60 000 FCFA"] },
];

export default function PublicTestPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const current = questions[step];
  const choose = (answer: string) => {
    const next = [...answers]; next[step] = answer; setAnswers(next);
  };
  if (submitted) return <main className="flex min-h-screen items-center justify-center bg-canvas px-5"><div className="w-full max-w-md rounded-[20px] bg-white p-8 text-center shadow-[0_18px_50px_rgba(74,38,48,.08)]"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-pale"><Check className="h-8 w-8 text-framboise" /></div><h1 className="display-font mt-7 text-5xl font-semibold leading-none text-prune">Merci pour ton regard.</h1><p className="mt-4 text-sm leading-6 text-prune/65">Tes réponses aideront Sutura Studio à préparer les bonnes pièces.</p></div></main>;
  return <main className="min-h-screen bg-canvas"><header className="mx-auto flex max-w-xl items-center justify-between px-5 py-6"><Image src="/brand/wordmark-framboise.png" alt="Sutura" width={100} height={32} /><span className="text-xs font-semibold text-prune/50">Rose Cotonou</span></header><div className="mx-auto max-w-xl px-5 pb-12 pt-10"><div className="mb-8 h-1.5 overflow-hidden rounded-full bg-rose-pale"><div className="h-full rounded-full bg-framboise transition-all" style={{ width: `${((step + 1) / questions.length) * 100}%` }} /></div><p className="text-xs font-bold uppercase tracking-[0.2em] text-framboise">Question {step + 1} sur {questions.length}</p><h1 className="display-font mt-4 text-5xl font-semibold leading-[.95] text-prune">{current.text}</h1><div className="mt-9 space-y-3">{current.options.map((option) => <button key={option} onClick={() => choose(option)} className={`flex min-h-[60px] w-full items-center justify-between rounded-[14px] border px-5 text-left text-sm font-bold transition ${answers[step] === option ? "border-framboise bg-rose-pale text-framboise" : "border-line bg-white text-prune hover:border-framboise/40"}`}>{option}<span className={`h-5 w-5 rounded-full border-2 ${answers[step] === option ? "border-framboise bg-framboise shadow-[inset_0_0_0_4px_#fce8eb]" : "border-line"}`} /></button>)}</div><div className="mt-10 flex items-center justify-between">{step > 0 ? <button onClick={() => setStep(step - 1)} className="inline-flex items-center gap-2 text-sm font-bold text-prune/60"><ChevronLeft className="h-4 w-4" />Retour</button> : <span />}{step < questions.length - 1 ? <button disabled={!answers[step]} onClick={() => setStep(step + 1)} className="inline-flex h-[52px] items-center rounded-[14px] bg-framboise px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Continuer <ArrowRight className="ml-2 h-4 w-4" /></button> : <button disabled={!answers[step]} onClick={() => setSubmitted(true)} className="inline-flex h-[52px] items-center rounded-[14px] bg-framboise px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Envoyer mes réponses <ArrowRight className="ml-2 h-4 w-4" /></button>}</div></div></main>;
}
