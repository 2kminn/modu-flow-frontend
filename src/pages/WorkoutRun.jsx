import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Camera, CameraOff, ChevronLeft, ChevronRight, RefreshCw, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  closeNativeCamera,
  isAndroidWebViewBridgeAvailable,
  onNativeEvent,
  openNativeCamera
} from "@/native/androidBridge";

const ROUTINE_STORAGE_KEY = "moduflow:routines-by-day:v1";

const EXERCISE_INFO = [
  {
    id: "pushup",
    name: "푸쉬업",
    description: "가슴과 삼두를 함께 강화하는 대표적인 맨몸 운동이에요."
  },
  {
    id: "bench-press",
    name: "벤치프레스",
    description: "가슴 근육을 집중적으로 자극하는 대표적인 웨이트 운동이에요."
  },
  {
    id: "pullup",
    name: "풀업",
    description: "상체 당기는 힘을 키우는 고전적인 운동이에요."
  },
  {
    id: "seated-row",
    name: "시티드 로우",
    description: "등 중앙을 안정적으로 강화할 수 있어요."
  },
  {
    id: "squat",
    name: "스쿼트",
    description: "하체와 코어를 함께 강화하는 전신 운동이에요."
  },
  {
    id: "lunge",
    name: "런지",
    description: "균형과 하체 근력을 함께 잡을 수 있어요."
  },
  {
    id: "overhead-press",
    name: "오버헤드 프레스",
    description: "어깨 전반을 키우는 기본 프레스 동작이에요."
  },
  {
    id: "lateral-raise",
    name: "사이드 레터럴 레이즈",
    description: "측면 어깨(삼각근 측면)를 집중적으로 자극해요."
  },
  {
    id: "biceps-curl",
    name: "바이셉 컬",
    description: "이두근을 단순하고 확실하게 자극할 수 있어요."
  },
  {
    id: "triceps-pushdown",
    name: "트라이셉스 푸시다운",
    description: "삼두를 안전하게 자극하기 좋은 케이블 운동이에요."
  },
  {
    id: "plank",
    name: "플랭크",
    description: "코어 안정성을 길러주는 정적 운동이에요."
  },
  {
    id: "crunch",
    name: "크런치",
    description: "복근(상복부)을 집중적으로 수축해요."
  }
];

function dayKeyFromDate(date) {
  const map = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return map[date.getDay()];
}

function loadRoutinesByDay() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ROUTINE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function resolveExerciseInfo(item) {
  const byId = item?.exerciseId
    ? EXERCISE_INFO.find((ex) => ex.id === item.exerciseId)
    : null;
  if (byId) return byId;
  const name = typeof item?.name === "string" ? item.name.trim() : "";
  if (!name) return null;
  return EXERCISE_INFO.find((ex) => ex.name === name) || null;
}

function analyzePosture() {
  // TODO: 자세 분석 기능은 추후 구현
}

export default function WorkoutRun() {
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraOn, setCameraOn] = useState(true);
  const [cameraState, setCameraState] = useState("idle"); // idle | ready | denied | error | native
  const [facingMode, setFacingMode] = useState("user"); // user | environment

  const todayKey = useMemo(() => dayKeyFromDate(new Date()), []);
  const routineList = useMemo(() => {
    const stored = loadRoutinesByDay();
    const list = stored?.[todayKey];
    return Array.isArray(list) ? list : [];
  }, [todayKey]);

  const [index, setIndex] = useState(0);
  const currentItem = routineList[index] ?? null;
  const currentInfo = useMemo(() => resolveExerciseInfo(currentItem), [currentItem]);
  const total = routineList.length;
  const nextItem = routineList[index + 1] ?? null;

  useEffect(() => {
    if (!cameraOn) return;
    let mounted = true;
    const useNativeCamera = isAndroidWebViewBridgeAvailable();

    async function startCamera() {
      try {
        if (useNativeCamera) {
          setCameraState("idle");
          const ok = openNativeCamera({
            type: "camera:open",
            facingMode,
            screen: "workout:run"
          });
          if (mounted) setCameraState(ok ? "native" : "error");
          return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
          if (mounted) setCameraState("error");
          return;
        }

        setCameraState("idle");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: false
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraState("ready");
      } catch (e) {
        const name = e?.name || "";
        if (name === "NotAllowedError" || name === "SecurityError") {
          setCameraState("denied");
        } else {
          setCameraState("error");
        }
      }
    }

    startCamera();

    return () => {
      mounted = false;
      if (useNativeCamera) {
        closeNativeCamera({ screen: "workout:run" });
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [cameraOn, facingMode]);

  useEffect(() => {
    if (!cameraOn) return;
    if (cameraState !== "ready") return;
    const id = window.setInterval(() => analyzePosture(), 1200);
    return () => window.clearInterval(id);
  }, [cameraOn, cameraState]);

  useEffect(() => {
    // Optional: Native can push status back to the web via CustomEvent.
    // detail example:
    // { type: "camera", status: "ready" | "denied" | "error" | "closed" }
    return onNativeEvent((detail) => {
      if (!detail || detail.type !== "camera") return;
      if (detail.status === "ready") setCameraState("native");
      else if (detail.status === "denied") setCameraState("denied");
      else if (detail.status === "error") setCameraState("error");
      else if (detail.status === "closed") setCameraState("idle");
    });
  }, []);

  function goPrev() {
    setIndex((prev) => Math.max(0, prev - 1));
  }

  function goNext() {
    setIndex((prev) => Math.min(total - 1, prev + 1));
  }

  function endWorkout() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    closeNativeCamera({ screen: "workout:run" });
    navigate("/");
  }

  if (!routineList.length) {
    return (
      <section className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-[color:var(--c-muted)]">
            운동 수행
          </p>
          <p className="mt-1 text-lg font-extrabold">
            루틴이 설정되지 않았습니다
          </p>
          <p className="mt-2 text-sm text-[color:var(--c-muted)]">
            마이페이지에서 오늘 루틴을 먼저 추가해 주세요.
          </p>
        </div>
        <Button type="button" onClick={() => navigate("/mypage/routines")}>
          루틴 설정하러 가기
        </Button>
        <Button type="button" variant="secondary" onClick={() => navigate("/workout")}>
          운동 탐색으로 이동
        </Button>
      </section>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      <div className="absolute inset-0">
        {cameraOn ? (
          <>
            {cameraState === "native" ? null : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/10 to-black/85" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-black" />
        )}

        {cameraOn && cameraState !== "ready" && cameraState !== "native" ? (
          <div className="absolute inset-0 grid place-items-center px-6">
            <div className="w-full max-w-[420px] rounded-3xl border border-white/10 bg-black/60 p-5 text-white backdrop-blur">
              <p className="text-sm font-semibold text-white/80">
                카메라를 준비 중이에요
              </p>
              <p className="mt-1 text-lg font-extrabold">
                운동 수행 화면
              </p>
              <p className="mt-3 text-sm text-white/80">
                {cameraState === "denied"
                  ? "카메라 권한이 필요해요. 브라우저 설정에서 허용 후 다시 시도해 주세요."
                  : "카메라가 없는 환경이거나 접근 중 오류가 발생했어요."}
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  className="h-12 flex-1 rounded-2xl bg-white/15 px-4 text-sm font-extrabold text-white active:scale-[0.98] transition"
                  onClick={() => navigate(-1)}
                >
                  뒤로
                </button>
                <button
                  type="button"
                  className="h-12 flex-1 rounded-2xl bg-white px-4 text-sm font-extrabold text-black active:scale-[0.98] transition duration-200 hover:bg-neutral-200"
                  onClick={() => window.location.reload()}
                >
                  다시 시도
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-[560px] items-center justify-between gap-3 px-4 pb-3 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm font-extrabold text-white backdrop-blur active:scale-[0.98] transition"
          >
            <span aria-hidden="true">←</span>
            운동 수행
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCameraOn((v) => !v)}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm font-extrabold text-white backdrop-blur active:scale-[0.98] transition"
            >
              {cameraOn ? (
                <>
                  <CameraOff size={16} aria-hidden="true" />
                  끄기
                </>
              ) : (
                <>
                  <Camera size={16} aria-hidden="true" />
                  켜기
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                setFacingMode((v) => (v === "user" ? "environment" : "user"))
              }
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-white backdrop-blur active:scale-[0.98] transition"
              aria-label="카메라 전환"
              disabled={!cameraOn}
            >
              <RotateCcw size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main className="absolute inset-x-0 top-20 z-20 bottom-24">
        <div className="mx-auto h-full max-w-[560px] px-4">
          <div className="flex h-full flex-col gap-3">
            <div className="rounded-3xl border border-white/10 bg-black/35 p-4 text-white backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-white/70">
                  현재 운동
                </p>
                <p className="text-xs font-extrabold text-white/80">
                  {index + 1} / {total}
                </p>
              </div>

              <div
                key={currentItem?.id ?? index}
                className="mt-2 transition duration-200 ease-out"
              >
                <p className="text-xl font-extrabold leading-tight">
                  {currentItem?.name || "운동 이름"}
                </p>
                <p className="mt-1 text-sm font-semibold text-white/75">
                  {currentInfo?.description || "운동 설명은 준비 중이에요."}
                </p>
                <p className="mt-3 text-xs font-semibold text-white/70">
                  세트: {currentItem?.sets ?? "-"} · 무게: {currentItem?.weight ?? "-"}kg
                </p>
              </div>
            </div>

            {nextItem ? (
              <Card className="border-white/10 bg-black/35 text-white backdrop-blur">
                <p className="text-xs font-semibold text-white/70">
                  다음 운동
                </p>
                <p className="mt-1 truncate text-sm font-extrabold">
                  {nextItem?.name || "운동 이름"}
                </p>
              </Card>
            ) : (
              <Card className="border-white/10 bg-black/35 text-white backdrop-blur">
                <p className="text-xs font-semibold text-white/70">
                  다음 운동
                </p>
                <p className="mt-1 text-sm font-extrabold">
                  마지막 운동이에요
                </p>
              </Card>
            )}

            <div className="mt-auto rounded-3xl border border-white/10 bg-black/35 p-3 text-white backdrop-blur">
              <p className="text-xs font-semibold text-white/70">
                자세 분석
              </p>
              <p className="mt-1 text-sm font-extrabold">
                준비 중 (카메라 영상만 표시)
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="absolute inset-x-0 bottom-0 z-20 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-[560px] px-4 pb-4">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={goPrev}
              disabled={index === 0}
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-3xl bg-white/15 text-sm font-extrabold text-white active:scale-[0.99] transition disabled:opacity-50 disabled:active:scale-100"
            >
              <ChevronLeft size={18} aria-hidden="true" />
              이전
            </button>
            <button
              type="button"
              onClick={endWorkout}
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-3xl bg-white text-sm font-extrabold text-black shadow-lg shadow-black/20 active:scale-[0.99] transition duration-200 hover:bg-neutral-200"
            >
              종료
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={index >= total - 1}
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-3xl bg-white/15 text-sm font-extrabold text-white active:scale-[0.99] transition disabled:opacity-50 disabled:active:scale-100"
            >
              다음
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="mt-2">
            <button
              type="button"
              onClick={() => setIndex(0)}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-3xl border border-white/10 bg-black/30 text-sm font-extrabold text-white backdrop-blur active:scale-[0.99] transition"
            >
              <RefreshCw size={16} aria-hidden="true" />
              처음부터 다시
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
