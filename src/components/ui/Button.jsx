export default function Button({ variant = "primary", className, ...props }) {
  const base =
    "inline-flex w-full items-center justify-center rounded-2xl px-5 py-4 text-base font-semibold shadow-sm transition duration-200 active:scale-[0.99] disabled:opacity-50 disabled:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--c-surface)]";

  const styles =
    variant === "primary"
      ? "border border-black bg-black text-white hover:bg-neutral-800 dark:border-white dark:bg-white dark:text-black dark:hover:bg-neutral-200"
      : "border border-[color:var(--c-border-strong)] bg-transparent text-[color:var(--c-text)] hover:bg-[color:var(--c-surface-2)]";

  return <button className={[base, styles, className].filter(Boolean).join(" ")} {...props} />;
}
