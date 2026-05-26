import { useState } from "react";

export default function FloatingLabelInput({
  id,
  label,
  placeholder,
  leftAdornment,
  rightAdornment,
  inputClassName = "",
  className = "",
  value,
  defaultValue,
  onFocus,
  onBlur,
  ...props
}) {
  const [focused, setFocused] = useState(false);
  const currentValue = value ?? defaultValue ?? "";
  const floating = focused || String(currentValue).length > 0;

  return (
    <div className={`relative ${className}`}>
      <input
        id={id}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder ?? " "}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        className={[
          "peer h-12 w-full rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4 pt-5 pb-2 text-base shadow-sm outline-none transition duration-200 placeholder:text-transparent",
          leftAdornment ? "pl-12" : "",
          rightAdornment ? "pr-12" : "",
          inputClassName,
        ].join(" ")}
        {...props}
      />
      <label
        htmlFor={id}
        className={[
          "pointer-events-none absolute -translate-y-1/2 font-semibold transition-[top,font-size,color,background-color,padding] duration-200 ease-out",
          leftAdornment ? "left-12" : "left-4",
          floating
            ? "top-0 bg-[color:var(--c-surface)] px-2 text-[11px] text-[color:var(--c-muted)]"
            : "top-1/2 px-0 text-sm text-[color:var(--c-muted-2)]",
        ].join(" ")}
      >
        {label}
      </label>
      {leftAdornment ? (
        <div className="absolute inset-y-0 left-3 flex items-center text-[color:var(--c-muted-2)]">
          {leftAdornment}
        </div>
      ) : null}
      {rightAdornment ? (
        <div className="absolute inset-y-0 right-2 flex items-center">
          {rightAdornment}
        </div>
      ) : null}
    </div>
  );
}
