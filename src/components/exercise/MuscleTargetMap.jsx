const BODY_MAP = {
  src: "/exercises/body-map-base.jpeg",
  width: 1988,
  height: 1594
};

const exerciseTargetMuscles = {
  squat: {
    label: "스쿼트 타겟 부위",
    muscles: ["core", "leftQuad", "rightQuad", "leftGlute", "rightGlute", "leftHamstring", "rightHamstring"]
  },
  lunge: {
    label: "런지 타겟 부위",
    muscles: ["core", "leftQuad", "rightQuad", "leftGlute", "rightGlute", "leftHamstring", "rightHamstring"]
  }
};

const muscleLabels = {
  core: "코어",
  leftQuad: "대퇴사두",
  rightQuad: "대퇴사두",
  leftGlute: "둔근",
  rightGlute: "둔근",
  leftHamstring: "햄스트링",
  rightHamstring: "햄스트링"
};

const muscleShapeMap = {
  core: {
    d: "M421 456 C439 433 468 433 489 449 C510 433 538 433 556 456 C562 532 559 648 522 738 C515 757 502 766 489 766 C476 766 463 757 456 738 C419 648 415 532 421 456Z",
    soft: true
  },
  leftQuad: {
    d: "M337 680 C377 676 438 706 484 758 C482 858 463 1001 422 1089 C398 1112 364 1112 345 1084 C321 1007 317 852 331 735 C333 710 334 692 337 680Z"
  },
  rightQuad: {
    d: "M494 758 C540 706 601 676 641 680 C644 692 645 710 647 735 C661 852 657 1007 633 1084 C614 1112 580 1112 556 1089 C515 1001 496 858 494 758Z"
  },
  leftGlute: {
    d: "M1356 690 C1388 660 1444 653 1484 682 C1499 722 1497 780 1477 816 C1442 840 1380 837 1350 806 C1335 765 1336 720 1356 690Z"
  },
  rightGlute: {
    d: "M1504 682 C1544 653 1600 660 1632 690 C1652 720 1653 765 1638 806 C1608 837 1546 840 1511 816 C1491 780 1489 722 1504 682Z"
  },
  leftHamstring: {
    d: "M1327 822 C1367 846 1434 847 1478 821 C1475 895 1464 1010 1432 1119 C1416 1169 1379 1185 1348 1151 C1325 1081 1316 939 1327 822Z",
    soft: true
  },
  rightHamstring: {
    d: "M1510 821 C1554 847 1621 846 1661 822 C1672 939 1663 1081 1640 1151 C1609 1185 1572 1169 1556 1119 C1524 1010 1513 895 1510 821Z",
    soft: true
  }
};

const musclePositionMap = {
  core: { left: "20.7%", top: "27.1%", width: "7.2%" },
  leftQuad: { left: "15.1%", top: "41.9%", width: "8.4%" },
  rightQuad: { left: "27.6%", top: "41.8%", width: "8.4%" },
  leftGlute: { left: "62.0%", top: "39.6%", width: "9.7%" },
  rightGlute: { left: "70.5%", top: "39.6%", width: "9.7%" },
  leftHamstring: { left: "60.8%", top: "50.5%", width: "9.6%" },
  rightHamstring: { left: "72.1%", top: "50.5%", width: "9.6%" }
};

function uniqueLabels(muscles) {
  return [...new Set(muscles.map((muscle) => muscleLabels[muscle]).filter(Boolean))];
}

function MuscleShape({ muscle }) {
  const shape = muscleShapeMap[muscle];
  if (!shape) return null;

  return (
    <path
      d={shape.d}
      fill={shape.soft ? "rgba(255, 79, 123, 0.52)" : "rgba(255, 79, 123, 0.68)"}
      style={{ mixBlendMode: "multiply" }}
    />
  );
}

function MuscleOverlaySvg({ muscles }) {
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${BODY_MAP.width} ${BODY_MAP.height}`}
      className="pointer-events-none absolute inset-0 z-10 h-full w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {muscles.map((muscle) => (
        <MuscleShape key={muscle} muscle={muscle} />
      ))}
    </svg>
  );
}

function MuscleOverlayImageFallback({ muscles }) {
  return (
    <>
      {muscles.map((muscle) => {
        const position = musclePositionMap[muscle];
        if (!position) return null;

        return (
          <div
            key={muscle}
            aria-hidden="true"
            className="pointer-events-none absolute z-10 rounded-full bg-[#ff4f7b]/70"
            style={{
              left: position.left,
              top: position.top,
              width: position.width,
              aspectRatio: "1 / 1"
            }}
          />
        );
      })}
    </>
  );
}

export default function MuscleTargetMap({ exerciseId }) {
  const target = exerciseTargetMuscles[exerciseId];
  if (!target) return null;

  const targetLabels = uniqueLabels(target.muscles);

  return (
    <div className="rounded-3xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-extrabold text-[color:var(--c-text)]">타겟 부위</p>
          <p className="mt-1 text-xs font-semibold text-[color:var(--c-muted-2)]">
            원본 바디맵과 같은 좌표계로 근육을 겹쳐 표시해요.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[#ff4f7b]/15 px-2.5 py-1 text-[11px] font-extrabold text-[#ff4f7b]">
          {exerciseId}
        </span>
      </div>

      <div className="mt-3 overflow-hidden rounded-3xl border border-[color:var(--c-border)] bg-[#eaf1f6]">
        <div className="relative w-full" style={{ aspectRatio: `${BODY_MAP.width} / ${BODY_MAP.height}` }}>
          <img
            src={BODY_MAP.src}
            alt={target.label}
            className="absolute inset-0 z-0 h-full w-full object-contain"
          />
          <MuscleOverlaySvg muscles={target.muscles} />
          {false ? <MuscleOverlayImageFallback muscles={target.muscles} /> : null}
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
    </div>
  );
}
