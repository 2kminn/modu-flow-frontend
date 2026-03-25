import { useEffect, useMemo, useRef } from "react";
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler
} from "chart.js";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler
);

export default function WeeklyWorkoutChart({ data, labels }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const safeLabels = useMemo(() => labels ?? ["월", "화", "수", "목", "금", "토", "일"], [labels]);
  const safeData = useMemo(() => data ?? [0, 25, 40, 20, 55, 35, 60], [data]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    chartRef.current?.destroy();

    const gradient = ctx.createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, "rgba(14,165,233,0.35)");
    gradient.addColorStop(1, "rgba(14,165,233,0)");

    chartRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: safeLabels,
        datasets: [
          {
            label: "운동 시간(분)",
            data: safeData,
            borderColor: "rgba(14,165,233,1)",
            backgroundColor: gradient,
            fill: true,
            tension: 0.35,
            pointRadius: 3,
            pointHoverRadius: 4,
            pointBorderWidth: 2,
            pointBackgroundColor: "rgba(255,255,255,1)",
            pointBorderColor: "rgba(14,165,233,1)"
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 350 },
        interaction: { intersect: false, mode: "index" },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(15,23,42,0.92)",
            titleColor: "rgba(255,255,255,0.9)",
            bodyColor: "rgba(255,255,255,0.9)",
            padding: 10,
            displayColors: false,
            callbacks: {
              label: (ctx2) => `${ctx2.parsed.y ?? 0}분`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "rgba(100,116,139,1)", font: { weight: "600" } },
            border: { display: false }
          },
          y: {
            beginAtZero: true,
            suggestedMax: Math.max(...safeData, 60),
            ticks: {
              color: "rgba(100,116,139,1)",
              font: { weight: "600" },
              callback: (v) => `${v}`
            },
            grid: { color: "rgba(148,163,184,0.25)" },
            border: { display: false }
          }
        }
      }
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [safeData, safeLabels]);

  return (
    <div className="relative h-44 w-full">
      <canvas ref={canvasRef} />
    </div>
  );
}

