import { useEffect, useMemo, useRef, useState } from "react";
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
  const [themeToken, setThemeToken] = useState(0);

  const safeLabels = useMemo(() => labels ?? ["월", "화", "수", "목", "금", "토", "일"], [labels]);
  const safeData = useMemo(() => data ?? [0, 25, 40, 20, 55, 35, 60], [data]);

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => setThemeToken((t) => t + 1));
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    chartRef.current?.destroy();

    const styles = getComputedStyle(document.documentElement);
    const line = styles.getPropertyValue("--c-chart-line")?.trim() || "rgba(10,10,10,0.92)";
    const fillTop = styles.getPropertyValue("--c-chart-fill-top")?.trim() || "rgba(10,10,10,0.18)";
    const fillBottom = styles.getPropertyValue("--c-chart-fill-bottom")?.trim() || "rgba(10,10,10,0)";
    const grid = styles.getPropertyValue("--c-chart-grid")?.trim() || "rgba(10,10,10,0.08)";
    const tick = styles.getPropertyValue("--c-chart-tick")?.trim() || "rgba(10,10,10,0.45)";
    const tooltipBg = styles.getPropertyValue("--c-chart-tooltip-bg")?.trim() || "rgba(10,10,10,0.92)";
    const tooltipText = styles.getPropertyValue("--c-chart-tooltip-text")?.trim() || "rgba(255,255,255,0.92)";
    const pointBg = styles.getPropertyValue("--c-chart-point-bg")?.trim() || "rgba(255,255,255,1)";

    const gradient = ctx.createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, fillTop);
    gradient.addColorStop(1, fillBottom);

    chartRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: safeLabels,
        datasets: [
          {
            label: "운동 시간(분)",
            data: safeData,
            borderColor: line,
            backgroundColor: gradient,
            fill: true,
            tension: 0.35,
            pointRadius: 3,
            pointHoverRadius: 4,
            pointBorderWidth: 2,
            pointBackgroundColor: pointBg,
            pointBorderColor: line
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
            backgroundColor: tooltipBg,
            titleColor: tooltipText,
            bodyColor: tooltipText,
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
            ticks: { color: tick, font: { weight: "600" } },
            border: { display: false }
          },
          y: {
            beginAtZero: true,
            suggestedMax: Math.max(...safeData, 60),
            ticks: {
              color: tick,
              font: { weight: "600" },
              callback: (v) => `${v}`
            },
            grid: { color: grid },
            border: { display: false }
          }
        }
      }
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [safeData, safeLabels, themeToken]);

  return (
    <div className="relative h-44 w-full">
      <canvas ref={canvasRef} />
    </div>
  );
}
