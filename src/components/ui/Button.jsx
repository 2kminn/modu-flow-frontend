// 화면 전반에서 동일한 크기와 색상 규칙을 쓰도록 primary·secondary 버튼 스타일을 제공한다.
export default function Button({ variant = "primary", className, ...props }) {
  const base =
    "inline-flex w-full items-center justify-center rounded-2xl px-5 py-4 text-base font-semibold shadow-sm transition duration-200 active:scale-[0.99] disabled:opacity-50 disabled:active:scale-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--c-surface)]";

  const styles =
    variant === "primary"
      ? "border border-transparent bg-[linear-gradient(135deg,var(--c-primary),var(--c-primary-strong))] text-white shadow-[0_10px_20px_rgba(37,99,235,0.18)] hover:brightness-105"
      : "border border-[color:var(--c-border)] bg-[color:var(--c-surface)] text-[color:var(--c-text)] hover:border-[color:var(--c-border-strong)] hover:bg-[color:var(--c-primary-soft)]";

  return <button className={[base, styles, className].filter(Boolean).join(" ")} {...props} />;
}
