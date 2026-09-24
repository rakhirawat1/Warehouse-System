"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type CapacityChartProps = {
  data: Array<{
    name: string;
    capacity: number;
    used: number;
  }>;
};

export default function CapacityChart({
  data,
}: CapacityChartProps) {
  const isEmpty = data.length === 0;

  return (
    <div className="h-56 w-full">
      {isEmpty ? (
        <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-border text-center">
          <p className="text-sm font-medium text-primary">
            No capacity data yet
          </p>

          <p className="mt-1 text-sm text-muted">
            Storage spaces added to warehouses will appear here.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 12, right: 12, left: 0, bottom: 4 }}
            barCategoryGap="28%"
            barGap={4}
          >
            <defs>
              <linearGradient
                id="capacityGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="var(--accent)" />
                <stop offset="100%" stopColor="var(--accent-hover)" />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              vertical={false}
            />

            <XAxis
              dataKey="name"
              tick={{
                fontSize: 11,
                fill: "var(--text-muted)",
              }}
              stroke="var(--border)"
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              tick={{
                fontSize: 11,
                fill: "var(--text-muted)",
              }}
              stroke="var(--border)"
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={(value: number) =>
                value >= 1000 ? `${Math.round(value / 1000)}k` : String(value)
              }
            />

            <Tooltip
              cursor={{
                fill: "var(--accent)",
                fillOpacity: 0.05,
              }}
              contentStyle={{
                borderRadius: 10,
                border: "1px solid var(--border)",
                backgroundColor: "var(--surface)",
                fontSize: 12,
                color: "var(--text-primary)",
                boxShadow: "var(--shadow-card-token)",
              }}
              labelStyle={{
                color: "var(--text-primary)",
                fontWeight: 600,
              }}
            />

            <Bar
              dataKey="capacity"
              name="Capacity"
              fill="var(--border)"
              radius={[5, 5, 0, 0]}
              maxBarSize={56}
            />

            <Bar
              dataKey="used"
              name="Used"
              fill="url(#capacityGradient)"
              radius={[5, 5, 0, 0]}
              maxBarSize={56}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}