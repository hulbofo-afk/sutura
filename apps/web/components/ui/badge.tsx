import type { ReactNode } from "react";

export type StatusTone = "progress" | "done" | "draft" | "neutral";

const tones: Record<StatusTone, string> = {
  // "En cours" — jaune signature du reference pack
  progress: "bg-jaune text-prune",
  // "Terminé / Publié" — prune foncé
  done: "bg-prune text-white",
  // "Brouillon" — rose pâle
  draft: "bg-rose-pale text-framboise",
  neutral: "bg-canvas text-prune/65 border border-line",
};

export function StatusBadge({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold leading-none ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export const collectionStatusMeta: Record<string, { label: string; tone: StatusTone }> = {
  draft: { label: "Brouillon", tone: "draft" },
  published: { label: "Publiée", tone: "done" },
  archived: { label: "Archivée", tone: "neutral" },
};

export const testStatusMeta: Record<string, { label: string; tone: StatusTone }> = {
  draft: { label: "Brouillon", tone: "draft" },
  published: { label: "En cours", tone: "progress" },
  closed: { label: "Terminé", tone: "done" },
};
