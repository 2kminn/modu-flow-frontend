const BODY_MAP = {
  src: "/exercises/body-map-base.jpeg",
  width: 1988,
  height: 1594
};

const exerciseTargetMuscles = {
  pushup: {
    label: "푸쉬업 타겟 부위",
    muscles: ["leftChest", "rightChest", "leftTriceps", "rightTriceps", "core"]
  },
  "bench-press": {
    label: "벤치프레스 타겟 부위",
    muscles: ["leftChest", "rightChest", "leftFrontDelt", "rightFrontDelt", "leftTriceps", "rightTriceps"]
  },
  pullup: {
    label: "풀업 타겟 부위",
    muscles: ["leftLat", "rightLat", "leftBiceps", "rightBiceps", "core"]
  },
  "seated-row": {
    label: "시티드 로우 타겟 부위",
    muscles: ["leftLat", "rightLat", "midBack", "leftBiceps", "rightBiceps"]
  },
  squat: {
    label: "스쿼트 타겟 부위",
    muscles: [
      "core",
      "leftQuad",
      "rightQuad",
      "leftGlute",
      "rightGlute",
      "leftHamstring",
      "rightHamstring",
      "leftFrontCalf",
      "rightFrontCalf",
      "leftBackCalf",
      "rightBackCalf"
    ]
  },
  lunge: {
    label: "런지 타겟 부위",
    muscles: [
      "core",
      "leftQuad",
      "rightQuad",
      "leftGlute",
      "rightGlute",
      "leftHamstring",
      "rightHamstring",
      "leftFrontCalf",
      "rightFrontCalf",
      "leftBackCalf",
      "rightBackCalf"
    ]
  },
  "overhead-press": {
    label: "오버헤드 프레스 타겟 부위",
    muscles: ["leftFrontDelt", "rightFrontDelt", "leftSideDelt", "rightSideDelt", "leftTriceps", "rightTriceps"]
  },
  "lateral-raise": {
    label: "사이드 레터럴 레이즈 타겟 부위",
    muscles: ["leftSideDelt", "rightSideDelt"]
  },
  "biceps-curl": {
    label: "바이셉 컬 타겟 부위",
    muscles: ["leftBiceps", "rightBiceps"]
  },
  "triceps-pushdown": {
    label: "트라이셉스 푸시다운 타겟 부위",
    muscles: ["leftTriceps", "rightTriceps"]
  },
  plank: {
    label: "플랭크 타겟 부위",
    muscles: ["core"]
  },
  crunch: {
    label: "크런치 타겟 부위",
    muscles: ["core"]
  }
};

const muscleLabels = {
  leftChest: "가슴",
  rightChest: "가슴",
  leftFrontDelt: "전면 어깨",
  rightFrontDelt: "전면 어깨",
  leftSideDelt: "측면 어깨",
  rightSideDelt: "측면 어깨",
  leftBiceps: "이두",
  rightBiceps: "이두",
  leftTriceps: "삼두",
  rightTriceps: "삼두",
  leftLat: "광배",
  rightLat: "광배",
  midBack: "등(중부)",
  core: "코어",
  leftQuad: "대퇴사두",
  rightQuad: "대퇴사두",
  leftGlute: "둔근",
  rightGlute: "둔근",
  leftHamstring: "햄스트링",
  rightHamstring: "햄스트링",
  leftFrontCalf: "종아리",
  rightFrontCalf: "종아리",
  leftBackCalf: "종아리",
  rightBackCalf: "종아리"
};

const muscleShapeMap = {
  leftChest: {
    d: "M329 292 C377 267 449 278 488 326 L488 438 C449 448 388 446 343 417 C316 381 313 330 329 292Z"
  },
  rightChest: {
    d: "M490 326 C529 278 601 267 649 292 C665 330 662 381 635 417 C590 446 529 448 490 438Z"
  },
  leftFrontDelt: {
    d: "M260 396 C270 329 300 294 355 279 C372 280 390 287 402 300 C379 343 349 382 315 405 C293 410 276 407 260 396Z",
    soft: true
  },
  rightFrontDelt: {
    d: "M577 300 C589 287 607 280 624 279 C679 294 709 329 719 396 C703 407 686 410 664 405 C630 382 600 343 577 300Z",
    soft: true
  },
  leftSideDelt: {
    d: "M1213 387 C1230 322 1274 286 1339 281 C1366 285 1387 298 1406 319 L1318 399 C1281 405 1247 400 1213 387Z",
    soft: true
  },
  rightSideDelt: {
    d: "M1571 319 C1590 298 1611 285 1638 281 C1703 286 1747 322 1764 387 C1730 400 1696 405 1659 399Z",
    soft: true
  },
  leftBiceps: {
    d: "M223 409 C251 391 288 401 312 431 C330 478 325 516 303 536 C274 540 242 524 224 494 C214 459 214 429 223 409Z"
  },
  rightBiceps: {
    d: "M666 431 C690 401 727 391 755 409 C764 429 764 459 754 494 C736 524 704 540 675 536 C653 516 648 478 666 431Z"
  },
  leftTriceps: {
    d: "M1217 388 C1248 382 1289 394 1318 408 C1312 448 1292 496 1262 535 C1231 538 1207 517 1195 489 C1190 453 1196 414 1217 388Z",
    soft: true
  },
  rightTriceps: {
    d: "M1664 408 C1693 394 1734 382 1765 388 C1786 414 1792 453 1787 489 C1775 517 1751 538 1720 535 C1690 496 1670 448 1664 408Z",
    soft: true
  },
  leftLat: {
    d: "M1288 338 C1328 357 1368 405 1415 489 C1420 565 1405 636 1364 697 C1333 660 1307 595 1292 519 C1286 454 1286 390 1288 338Z"
  },
  rightLat: {
    d: "M1587 489 C1634 405 1674 357 1714 338 C1716 390 1716 454 1710 519 C1695 595 1669 660 1638 697 C1597 636 1582 565 1587 489Z"
  },
  midBack: {
    d: "M1399 307 C1422 289 1460 278 1498 278 C1536 278 1574 289 1597 307 C1572 375 1543 456 1515 545 C1510 574 1505 603 1498 632 C1491 603 1486 574 1481 545 C1453 456 1424 375 1399 307Z",
    soft: true
  },
  core: {
    d: "M421 456 C439 433 468 433 489 449 C510 433 538 433 556 456 C562 532 559 648 522 738 C515 757 502 766 489 766 C476 766 463 757 456 738 C419 648 415 532 421 456Z",
    soft: true
  },
  leftQuad: {
    d: "M331 660 C379 638 452 682 484 765 C487 887 462 1032 424 1084 C402 1108 365 1093 354 1056 C332 961 320 771 331 660Z"
  },
  rightQuad: {
    d: "M494 765 C526 682 599 638 647 660 C658 771 646 961 624 1056 C613 1093 576 1108 554 1084 C516 1032 491 887 494 765Z"
  },
  leftGlute: {
    d: "M1363 684 C1394 649 1455 647 1495 685 C1499 731 1495 789 1475 819 C1442 840 1378 837 1354 804 C1339 762 1343 714 1363 684Z"
  },
  rightGlute: {
    d: "M1499 685 C1539 647 1600 649 1631 684 C1651 714 1655 762 1640 804 C1616 837 1552 840 1519 819 C1499 789 1495 731 1499 685Z"
  },
  leftHamstring: {
    d: "M1325 802 C1371 835 1430 839 1491 816 C1486 915 1462 1088 1430 1171 C1415 1204 1378 1197 1353 1159 C1329 1051 1315 892 1325 802Z",
    soft: true
  },
  rightHamstring: {
    d: "M1506 816 C1567 839 1626 835 1672 802 C1682 892 1668 1051 1644 1159 C1619 1197 1582 1204 1567 1171 C1535 1088 1511 915 1506 816Z",
    soft: true
  },
  leftFrontCalf: {
    d: "M333 1115 C357 1145 395 1152 424 1128 C445 1236 438 1390 414 1462 C391 1487 352 1481 334 1449 C314 1324 314 1204 333 1115Z",
    soft: true
  },
  rightFrontCalf: {
    d: "M554 1128 C583 1152 621 1145 645 1115 C664 1204 664 1324 644 1449 C626 1481 587 1487 564 1462 C540 1390 533 1236 554 1128Z",
    soft: true
  },
  leftBackCalf: {
    d: "M1312 1180 C1349 1211 1385 1209 1419 1174 C1430 1263 1424 1400 1397 1473 C1370 1497 1332 1490 1314 1455 C1294 1356 1295 1251 1312 1180Z",
    soft: true
  },
  rightBackCalf: {
    d: "M1579 1174 C1613 1209 1649 1211 1686 1180 C1703 1251 1704 1356 1684 1455 C1666 1490 1628 1497 1601 1473 C1574 1400 1568 1263 1579 1174Z",
    soft: true
  }
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
        <div
          className="relative w-full"
          style={{ aspectRatio: `${BODY_MAP.width} / ${BODY_MAP.height}` }}
        >
          <img
            src={BODY_MAP.src}
            alt={target.label}
            className="absolute inset-0 z-0 h-full w-full object-contain"
          />
          <MuscleOverlaySvg muscles={target.muscles} />
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
