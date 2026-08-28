import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

const inputClasses =
  "mt-2 h-12 w-full rounded-[14px] border border-line bg-canvas px-4 text-sm text-prune outline-none transition placeholder:text-prune/40 focus:border-framboise focus:bg-white focus:ring-4 focus:ring-framboise/10";

const textareaClasses =
  "mt-2 w-full resize-none rounded-[14px] border border-line bg-canvas p-4 text-sm leading-6 text-prune outline-none transition placeholder:text-prune/40 focus:border-framboise focus:bg-white focus:ring-4 focus:ring-framboise/10";

type FieldProps = {
  label: ReactNode;
  optional?: boolean;
  hint?: string;
  children: ReactNode;
};

function FieldShell({ label, optional, hint, children }: FieldProps) {
  return (
    <label className="block text-sm font-semibold text-prune">
      <span className="flex items-baseline justify-between gap-3">
        <span>
          {label}
          {optional && <span className="ml-1.5 font-normal text-prune/40">(facultatif)</span>}
        </span>
        {hint && <span className="text-[11px] font-medium text-prune/40">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export function TextField({
  label,
  optional,
  hint,
  ...rest
}: { label: ReactNode; optional?: boolean; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldShell label={label} optional={optional} hint={hint}>
      <input className={inputClasses} {...rest} />
    </FieldShell>
  );
}

export function TextAreaField({
  label,
  optional,
  hint,
  maxLength,
  value,
  ...rest
}: {
  label: ReactNode;
  optional?: boolean;
  hint?: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const length = typeof value === "string" ? value.length : undefined;
  return (
    <FieldShell
      label={label}
      optional={optional}
      hint={hint ?? (maxLength && length !== undefined ? `${length}/${maxLength}` : undefined)}
    >
      <textarea className={textareaClasses} maxLength={maxLength} value={value} {...rest} />
    </FieldShell>
  );
}
