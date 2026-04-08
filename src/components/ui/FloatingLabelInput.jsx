export default function FloatingLabelInput({
  id,
  label,
  placeholder,
  rightAdornment,
  inputClassName = "",
  className = "",
  ...props
}) {
  return (
    <div className={`relative ${className}`}>
      <input
        id={id}
        placeholder={placeholder ?? " "}
        className={[
          "peer h-12 w-full rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4 pt-5 pb-2 text-sm shadow-sm outline-none transition duration-200 placeholder:text-transparent",
          rightAdornment ? "pr-12" : "",
          inputClassName,
        ].join(" ")}
        {...props}
      />
      <label
        htmlFor={id}
        className={[
          "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[color:var(--c-muted-2)] transition-all duration-200",
          "peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[11px] peer-focus:text-[color:var(--c-muted)] peer-focus:bg-[color:var(--c-surface)] peer-focus:px-2",
          "peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:-translate-y-1/2 peer-[&:not(:placeholder-shown)]:text-[11px] peer-[&:not(:placeholder-shown)]:text-[color:var(--c-muted)] peer-[&:not(:placeholder-shown)]:bg-[color:var(--c-surface)] peer-[&:not(:placeholder-shown)]:px-2",
        ].join(" ")}
      >
        {label}
      </label>
      {rightAdornment ? (
        <div className="absolute inset-y-0 right-2 flex items-center">
          {rightAdornment}
        </div>
      ) : null}
    </div>
  );
}
