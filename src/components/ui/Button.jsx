export default function Button({ variant = "primary", className, ...props }) {
  const base =
    "inline-flex w-full items-center justify-center rounded-2xl px-5 py-4 text-base font-semibold shadow-sm transition active:scale-[0.99] disabled:opacity-50 disabled:active:scale-100";

  const styles =
    variant === "primary"
      ? "bg-sky-600 text-white hover:bg-sky-700"
      : "border border-[color:var(--c-border)] bg-[color:var(--c-surface)] text-[color:var(--c-text)] hover:bg-[color:var(--c-surface-2)]";

  return <button className={[base, styles, className].filter(Boolean).join(" ")} {...props} />;
}
