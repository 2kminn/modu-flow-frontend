export default function Card({ className, ...props }) {
  return (
    <div
      className={[
        "rounded-3xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-4 shadow-sm",
        className
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
