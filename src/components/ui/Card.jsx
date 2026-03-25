export default function Card({ className, ...props }) {
  return (
    <div
      className={[
        "rounded-3xl border border-slate-200 bg-white p-4 shadow-sm",
        className
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
