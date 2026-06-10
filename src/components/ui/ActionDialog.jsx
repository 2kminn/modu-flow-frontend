import { useEffect, useId } from "react";
import { AlertCircle, LogOut, Trash2 } from "lucide-react";

const icons = {
  danger: Trash2,
  logout: LogOut,
  info: AlertCircle
};

export default function ActionDialog({
  open = true,
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  tone = "info",
  onConfirm,
  onCancel,
  busy = false
}) {
  const titleId = useId();
  const descriptionId = useId();
  const Icon = icons[tone] || AlertCircle;
  const isAlert = !onCancel;

  useEffect(() => {
    if (!open) return undefined;
    function handleKeyDown(event) {
      if (event.key !== "Escape") return;
      if (onCancel) onCancel();
      else onConfirm?.();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel, onConfirm, open]);

  if (!open) return null;

  const iconClass =
    tone === "danger"
      ? "bg-red-500/10 text-[color:var(--c-danger)]"
      : "bg-[color:var(--c-primary-soft)] text-[color:var(--c-primary)]";
  const confirmClass =
    tone === "danger"
      ? "bg-[color:var(--c-danger)] hover:brightness-105"
      : "bg-[linear-gradient(135deg,var(--c-primary),var(--c-primary-strong))] hover:brightness-105";

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target !== event.currentTarget || busy) return;
        if (onCancel) onCancel();
      }}
    >
      <div
        role={isAlert ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="w-full max-w-sm rounded-3xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-5 text-[color:var(--c-text)] shadow-2xl"
      >
        <div className="flex items-start gap-3">
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${iconClass}`}>
            <Icon size={20} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-extrabold">
              {title}
            </h2>
            {description ? (
              <p
                id={descriptionId}
                className="mt-1 text-sm font-semibold leading-6 text-[color:var(--c-muted)]"
              >
                {description}
              </p>
            ) : null}
          </div>
        </div>

        <div className={`mt-5 grid gap-2 ${onCancel ? "grid-cols-2" : "grid-cols-1"}`}>
          {onCancel ? (
            <button
              type="button"
              disabled={busy}
              className="h-12 rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] text-sm font-extrabold transition hover:bg-[color:var(--c-surface-2)] disabled:opacity-50"
              onClick={onCancel}
            >
              {cancelLabel}
            </button>
          ) : null}
          <button
            type="button"
            disabled={busy}
            className={`h-12 rounded-2xl text-sm font-extrabold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-50 ${confirmClass}`}
            onClick={onConfirm}
          >
            {busy ? "처리 중" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
