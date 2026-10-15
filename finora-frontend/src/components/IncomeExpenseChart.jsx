import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import { money } from "../utils/format";

Chart.register(...registerables);

export default function IncomeExpenseChart({ labels, income, expenses }) {
  const canvas = useRef(null);

  useEffect(() => {
    const chart = new Chart(canvas.current, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Income",
            data: income,
            backgroundColor: "#39ad87",
            borderRadius: 5,
            maxBarThickness: 17
          },
          {
            label: "Expenses",
            data: expenses,
            backgroundColor: "#f0a19a",
            borderRadius: 5,
            maxBarThickness: 17
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 450 },
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              usePointStyle: true,
              pointStyle: "circle",
              boxWidth: 7,
              boxHeight: 7,
              padding: 18,
              color: "#7e8d95",
              font: { size: 10, family: "DM Sans" }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: ${money(context.raw)}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: "#95a1a8", font: { size: 10 } }
          },
          y: {
            beginAtZero: true,
            border: { display: false, dash: [4, 4] },
            grid: { color: "#eef1f2" },
            ticks: {
              maxTicksLimit: 5,
              color: "#95a1a8",
              font: { size: 9 },
              callback: (value) =>
                value >= 100000
                  ? `₹${(value / 100000).toFixed(1)}L`
                  : value >= 1000
                    ? `₹${(value / 1000).toFixed(0)}k`
                    : `₹${value}`
            }
          }
        }
      }
    });

    return () => chart.destroy();
  }, [labels, income, expenses]);

  return (
    <canvas
      ref={canvas}
      id="incomeExpenseChart"
      aria-label="Monthly income and expenses chart"
    />
  );
}
