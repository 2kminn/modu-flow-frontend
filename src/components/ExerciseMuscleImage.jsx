const AREA_LABELS = {
  chest: "가슴",
  shoulders: "어깨",
  biceps: "이두",
  triceps: "삼두",
  abs: "코어",
  lats: "광배",
  upperBack: "등",
  glutes: "둔근",
  quads: "대퇴사두",
  hamstrings: "햄스트링"
};

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function ExerciseMuscleImage({ areas = [], name = "운동", compact = false }) {
  const activeAreas = new Set(areas);
  const active = (key) => activeAreas.has(key);
  const areaText = areas.map((area) => AREA_LABELS[area]).filter(Boolean).join(", ");

  const muscleClass = (key) =>
    active(key)
      ? "fill-rose-500 stroke-rose-700 dark:fill-rose-400 dark:stroke-rose-200"
      : "fill-[color:var(--c-surface)] stroke-[color:var(--c-border-strong)]";

  return (
    <figure
      className={cx(
        "relative overflow-hidden rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface-2)]",
        compact ? "h-16 w-16 shrink-0" : "min-h-[220px] w-full"
      )}
      aria-label={`${name} 자극 부위 이미지${areaText ? `: ${areaText}` : ""}`}
    >
      <svg
        viewBox="0 0 240 260"
        role="img"
        className="h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="bodyShade" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <rect width="240" height="260" rx="28" className="fill-transparent" />
        <circle cx="120" cy="34" r="20" className="fill-[color:var(--c-surface)] stroke-[color:var(--c-border-strong)]" strokeWidth="3" />
        <path d="M94 59 Q120 75 146 59 L154 106 Q148 151 137 190 H103 Q92 151 86 106 Z" className="fill-[color:var(--c-surface)] stroke-[color:var(--c-border-strong)]" strokeWidth="3" />
        <path d="M91 66 C69 72 56 94 51 122" className={muscleClass("shoulders")} strokeWidth="13" strokeLinecap="round" />
        <path d="M149 66 C171 72 184 94 189 122" className={muscleClass("shoulders")} strokeWidth="13" strokeLinecap="round" />
        <path d="M62 118 C58 144 55 165 48 187" className={muscleClass("biceps")} strokeWidth="12" strokeLinecap="round" />
        <path d="M178 118 C182 144 185 165 192 187" className={muscleClass("biceps")} strokeWidth="12" strokeLinecap="round" />
        <path d="M76 121 C70 146 67 168 62 192" className={muscleClass("triceps")} strokeWidth="9" strokeLinecap="round" />
        <path d="M164 121 C170 146 173 168 178 192" className={muscleClass("triceps")} strokeWidth="9" strokeLinecap="round" />
        <path d="M99 78 C108 73 116 74 120 83 C124 74 132 73 141 78 L136 112 C128 117 112 117 104 112 Z" className={muscleClass("chest")} strokeWidth="2.5" />
        <path d="M93 88 C82 104 80 130 90 151" className={muscleClass("lats")} strokeWidth="12" strokeLinecap="round" />
        <path d="M147 88 C158 104 160 130 150 151" className={muscleClass("lats")} strokeWidth="12" strokeLinecap="round" />
        <path d="M101 76 C112 68 128 68 139 76" className={muscleClass("upperBack")} strokeWidth="8" strokeLinecap="round" fill="none" />
        <path d="M108 117 H132 L137 164 H103 Z" className={muscleClass("abs")} strokeWidth="2.5" />
        <path d="M104 135 H136 M106 151 H134 M120 119 V164" className="stroke-[color:var(--c-border-strong)]" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M102 190 C108 204 132 204 138 190 L145 211 C136 224 104 224 95 211 Z" className={muscleClass("glutes")} strokeWidth="2.5" />
        <path d="M101 211 L89 246 H112 L119 211 Z" className={muscleClass("quads")} strokeWidth="2.5" />
        <path d="M139 211 L151 246 H128 L121 211 Z" className={muscleClass("quads")} strokeWidth="2.5" />
        <path d="M91 211 L84 246 H72 L82 213 Z" className={muscleClass("hamstrings")} strokeWidth="2.5" />
        <path d="M149 211 L156 246 H168 L158 213 Z" className={muscleClass("hamstrings")} strokeWidth="2.5" />
      </svg>
      {!compact ? (
        <figcaption className="absolute inset-x-3 bottom-3 rounded-xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)]/90 px-3 py-2 text-center text-xs font-extrabold text-[color:var(--c-text)] shadow-sm backdrop-blur">
          {areaText || "자극 부위"}
        </figcaption>
      ) : null}
    </figure>
  );
}
