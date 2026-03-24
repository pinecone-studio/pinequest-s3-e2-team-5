"use client";

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { cn } from "@/lib/utils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

type BarChartProps = {
  data: ChartData<"bar">;
  options?: ChartOptions<"bar">;
  className?: string;
};

type LineChartProps = {
  data: ChartData<"line">;
  options?: ChartOptions<"line">;
  className?: string;
};

type DoughnutChartProps = {
  data: ChartData<"doughnut">;
  options?: ChartOptions<"doughnut">;
  className?: string;
};

export const baseBarChartOptions: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top",
      labels: {
        usePointStyle: true,
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      border: {
        display: false,
      },
    },
    y: {
      beginAtZero: true,
      ticks: {
        precision: 0,
      },
      grid: {
        color: "rgba(120, 113, 108, 0.18)",
      },
      border: {
        display: false,
      },
    },
  },
};

export const baseLineChartOptions: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: "index",
  },
  plugins: {
    legend: {
      position: "top",
      labels: {
        usePointStyle: true,
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      border: {
        display: false,
      },
    },
    y: {
      beginAtZero: true,
      ticks: {
        precision: 0,
      },
      grid: {
        color: "rgba(120, 113, 108, 0.18)",
      },
      border: {
        display: false,
      },
    },
  },
};

export const baseDoughnutChartOptions: ChartOptions<"doughnut"> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "68%",
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        usePointStyle: true,
      },
    },
  },
};

export function BarChart({ data, options, className }: BarChartProps) {
  return (
    <div className={cn("h-72 w-full", className)}>
      <Bar data={data} options={options ?? baseBarChartOptions} />
    </div>
  );
}

export function LineChart({ data, options, className }: LineChartProps) {
  return (
    <div className={cn("h-72 w-full", className)}>
      <Line data={data} options={options ?? baseLineChartOptions} />
    </div>
  );
}

export function DoughnutChart({
  data,
  options,
  className,
}: DoughnutChartProps) {
  return (
    <div className={cn("h-72 w-full", className)}>
      <Doughnut data={data} options={options ?? baseDoughnutChartOptions} />
    </div>
  );
}

export type { ChartData, ChartOptions };
