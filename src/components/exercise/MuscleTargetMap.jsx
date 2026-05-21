const BODY_MAP = {
  src: "/exercises/body-map-base.jpeg",
  width: 1988,
  height: 1594
};

const OVERLAY_BASE_PATH = "/exercises/overlays";

const muscleOverlays = {
  back: {
    label: "등",
    src: `${OVERLAY_BASE_PATH}/back.png`
  },
  biceps: {
    label: "이두",
    src: `${OVERLAY_BASE_PATH}/biceps.png`
  },
  abs: {
    label: "복근",
    src: `${OVERLAY_BASE_PATH}/abs.png`
  },
  calf: {
    label: "종아리",
    src: `${OVERLAY_BASE_PATH}/calf.png`
  },
  chest: {
    label: "가슴",
    src: `${OVERLAY_BASE_PATH}/chest.png`
  },
  core: {
    label: "코어",
    src: `${OVERLAY_BASE_PATH}/abs.png`
  },
  glute: {
    label: "둔근",
    src: `${OVERLAY_BASE_PATH}/glute.png`
  },
  hamstring: {
    label: "햄스트링",
    src: `${OVERLAY_BASE_PATH}/hamstring.png`
  },
  quad: {
    label: "대퇴사두",
    src: `${OVERLAY_BASE_PATH}/quad.png`
  },
  shoulder: {
    label: "어깨",
    src: `${OVERLAY_BASE_PATH}/shoulder.png`
  },
  triceps: {
    label: "삼두",
    src: `${OVERLAY_BASE_PATH}/triceps.png`
  }
};

function uniqueTargetLabels(targetMuscles) {
  return [
    ...new Set(
      targetMuscles
        .map((muscle) => muscleOverlays[muscle]?.label)
        .filter(Boolean)
    )
  ];
}

function MuscleOverlayImage({ muscle }) {
  const overlay = muscleOverlays[muscle];
  if (!overlay) return null;

  return (
    <img
      src={overlay.src}
      alt=""
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 h-full w-full object-contain"
      onError={(event) => {
        event.currentTarget.style.display = "none";
      }}
      style={{ mixBlendMode: "multiply" }}
    />
  );
}

export default function MuscleTargetMap({ exerciseName, targetMuscles = [] }) {
  const visibleTargetMuscles = targetMuscles.filter((muscle) => muscleOverlays[muscle]);
  const targetLabels = uniqueTargetLabels(visibleTargetMuscles);

  return (
    <div className="rounded-3xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-extrabold text-[color:var(--c-text)]">타겟 부위</p>
          <p className="mt-1 text-xs font-semibold text-[color:var(--c-muted-2)]">
            기본 인체 이미지 위에 근육별 투명 PNG를 겹쳐 표시해요.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[#ff4f7b]/15 px-2.5 py-1 text-[11px] font-extrabold text-[#ff4f7b]">
          {exerciseName}
        </span>
      </div>

      <div className="mt-3 overflow-hidden rounded-3xl border border-[color:var(--c-border)] bg-[#eaf1f6]">
        <div
          className="relative w-full"
          style={{ aspectRatio: `${BODY_MAP.width} / ${BODY_MAP.height}` }}
        >
          <img
            src={BODY_MAP.src}
            alt={`${exerciseName} 타겟 부위`}
            className="absolute inset-0 z-0 h-full w-full object-contain"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
          {visibleTargetMuscles.map((muscle) => (
            <MuscleOverlayImage key={muscle} muscle={muscle} />
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {targetLabels.map((name) => (
          <span
            key={name}
            className="rounded-full border border-[#ff4f7b]/25 bg-[#ff4f7b]/10 px-3 py-1 text-xs font-extrabold text-[#ff4f7b]"
          >
            {name}
          </span>
        ))}
      </div>

      <div className="mt-3 rounded-2xl bg-[color:var(--c-surface-2)] px-3 py-2 text-[11px] font-semibold text-[color:var(--c-muted-2)]">
        debug: {exerciseName || "-"} / targetMuscles:{" "}
        {targetMuscles.length > 0 ? targetMuscles.join(", ") : "-"}
      </div>
    </div>
  );
}
