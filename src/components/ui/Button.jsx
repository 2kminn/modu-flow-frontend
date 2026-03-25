export default function Button({ variant = "primary", className, ...props }) {
  const base =
    "inline-flex w-full items-center justify-center rounded-2xl px-5 py-4 text-base font-semibold shadow-sm transition active:scale-[0.99] disabled:opacity-50 disabled:active:scale-100";

  const styles =
    variant === "primary"
      ? "bg-sky-600 text-white hover:bg-sky-700"
      : "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50";

  return <button className={[base, styles, className].filter(Boolean).join(" ")} {...props} />;
}
