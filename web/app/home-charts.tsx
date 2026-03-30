"use client";

import { BarChart, DoughnutChart, type ChartData } from "@/components/charts";

const activityChartData: ChartData<"bar"> = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  datasets: [
    {
      label: "Solved quizzes",
      data: [18, 24, 20, 31, 27, 36],
      backgroundColor: [
        "#111827",
        "#1f2937",
        "#334155",
        "#0f766e",
        "#0f766e",
        "#f59e0b",
      ],
      borderRadius: 999,
      borderSkipped: false,
      maxBarThickness: 26,
    },
  ],
};

const progressChartData: ChartData<"doughnut"> = {
  labels: ["Completed", "In review", "Needs retry"],
  datasets: [
    {
      data: [62, 23, 15],
      backgroundColor: ["#111827", "#0f766e", "#f59e0b"],
      borderWidth: 0,
      hoverOffset: 6,
    },
  ],
};

export function HomeCharts() {
  return (
    <>
      <div className="rounded-2xl bg-muted/60 p-4">
        <BarChart data={activityChartData} className="h-64" />
      </div>
      <div className="rounded-2xl bg-muted/60 p-4">
        <DoughnutChart data={progressChartData} className="h-64" />
      </div>
    </>
  );
}
