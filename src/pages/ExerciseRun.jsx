import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const EXERCISE_NAME = {
  squat: "스쿼트",
  pushup: "푸쉬업",
  lunge: "런지",
  plank: "플랭크"
};

export default function ExerciseRun() {
  const navigate = useNavigate();
  const { exerciseId } = useParams();
  const title = useMemo(() => EXERCISE_NAME[exerciseId] ?? "운동", [exerciseId]);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraState, setCameraState] = useState("idle"); // idle | ready | denied | error

  const [count, setCount] = useState(8);
  const [accuracy, setAccuracy] = useState(92);
  const [message, setMessage] = useState("허리를 곧게 유지해요");

  useEffect(() => {
    let mounted = true;

    async function startCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          if (mounted) setCameraState("error");
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
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
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setAccuracy((prev) => {
        const next = Math.max(65, Math.min(99, prev + (Math.random() > 0.5 ? 1 : -2)));
        return next;
      });
      setMessage((prev) => {
        const msgs = [
          "호흡을 천천히 유지해요",
          "무릎이 안쪽으로 모이지 않게",
          "코어에 힘을 주세요",
          "상체를 곧게 세워요",
          "좋아요, 유지!"
        ];
        const pick = msgs[Math.floor(Math.random() * msgs.length)];
        return pick === prev ? prev : pick;
      });
    }, 1600);

    return () => window.clearInterval(id);
  }, []);

  function end() {
    navigate(`/workout/${exerciseId ?? ""}`);
  }

  function accuracyTone(a) {
    if (a >= 90) return "text-emerald-300";
    if (a >= 75) return "text-amber-300";
    return "text-rose-300";
  }

  return (
    <div className="fixed inset-0 bg-black">
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/10 to-black/80" />

        {cameraState !== "ready" ? (
          <div className="absolute inset-0 grid place-items-center px-6">
            <div className="w-full max-w-[420px] rounded-3xl border border-white/10 bg-black/60 p-5 text-white backdrop-blur">
              <p className="text-sm font-semibold text-white/80">
                카메라를 준비 중이에요
              </p>
              <p className="mt-1 text-lg font-extrabold">{title} 실행</p>
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
                  className="h-12 flex-1 rounded-2xl bg-sky-500 px-4 text-sm font-extrabold text-white active:scale-[0.98] transition"
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
        <div className="mx-auto flex max-w-[520px] items-center justify-between px-4 pb-3 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 text-sm font-extrabold text-white backdrop-blur active:scale-[0.98] transition"
          >
            <span aria-hidden="true">←</span>
            {title}
          </button>
          <button
            type="button"
            onClick={() => setCount((c) => c + 1)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-white backdrop-blur active:scale-[0.98] transition"
            aria-label="횟수 +1 (더미)"
          >
            +1
          </button>
        </div>
      </header>

      <div className="absolute inset-x-0 top-20 z-20">
        <div className="mx-auto max-w-[520px] px-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-3xl border border-white/10 bg-black/35 p-4 text-white backdrop-blur">
              <p className="text-xs font-semibold text-white/70">횟수</p>
              <p className="mt-1 text-5xl font-extrabold leading-none">{count}</p>
              <p className="mt-2 text-xs font-semibold text-white/70">
                목표 12회 (더미)
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/35 p-4 text-white backdrop-blur">
              <p className="text-xs font-semibold text-white/70">자세 정확도</p>
              <div className="mt-1 flex items-end justify-between gap-3">
                <p
                  className={[
                    "text-4xl font-extrabold leading-none",
                    accuracyTone(accuracy)
                  ].join(" ")}
                >
                  {accuracy}%
                </p>
                <div className="w-24">
                  <div className="h-2 overflow-hidden rounded-full bg-white/15">
                    <div
                      className={[
                        "h-full rounded-full",
                        accuracy >= 90
                          ? "bg-emerald-400"
                          : accuracy >= 75
                            ? "bg-amber-400"
                            : "bg-rose-400"
                      ].join(" ")}
                      style={{ width: `${accuracy}%` }}
                    />
                  </div>
                  <p className="mt-2 text-right text-[11px] font-semibold text-white/70">
                    실시간 (더미)
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs font-semibold text-white/80">
                {accuracy >= 90
                  ? "아주 좋아요"
                  : accuracy >= 75
                    ? "좋아요, 조금만 더"
                    : "자세를 다시 잡아볼까요?"}
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-3xl border border-white/10 bg-black/35 px-4 py-3 text-white backdrop-blur">
            <p className="text-xs font-semibold text-white/70">피드백</p>
            <p className="mt-1 text-sm font-extrabold">{message}</p>
          </div>
        </div>
      </div>

      <footer className="absolute inset-x-0 bottom-0 z-20 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-[520px] px-4 pb-4">
          <button
            type="button"
            onClick={end}
            className="h-14 w-full rounded-3xl bg-rose-500 text-base font-extrabold text-white shadow-lg shadow-rose-500/25 active:scale-[0.99] transition"
          >
            종료
          </button>
        </div>
      </footer>
    </div>
  );
}

