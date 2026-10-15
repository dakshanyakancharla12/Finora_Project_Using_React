import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import { money } from "../utils/format";

Chart.register(...registerables);

export const PALETTE = [
  "#16866a",
  "#80c9ad",
  "#f0b47c",
  "#8e83d8",
  "#e88383",
  "#5c9dd5",
  "#d1b85d",
  "#6daeb0",
  "#b18acb",
  "#a5b0b8"
];

export default function CategoryChart({ categories }) {
  const canvas = useRef(null);

  useEffect(() => {
    if (!categories.length) return undefined;

    const chart = new Chart(canvas.current, {
      type: "doughnut",
      data: {
        labels: categories.map(([name]) => name),
        datasets: [
          {
            data: categories.map(([, value]) => value),
            backgroundColor: categories.map((_, i) => PALETTE[i % PALETTE.length]),
            borderWidth: 3,
            borderColor: "#ffffff",
            hoverOffset: 5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "75%",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `${context.label}: ${money(context.raw)}`
            }
          }
        }
      }
    });

    return () => chart.destroy();
  }, [categories]);

  return <canvas ref={canvas} id="categoryChart" aria-label="Expense categories chart" />;
}
