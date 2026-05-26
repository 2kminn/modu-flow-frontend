export default function Card({ as: Component = "div", className, ...props }) {
  return (
    <Component
      className={[
        "rounded-3xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-[background-color,border-color,box-shadow] duration-200 dark:shadow-none",
        className
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
