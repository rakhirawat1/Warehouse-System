"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import Counter from "@/components/motion/counter";

type ItemStatusChartProps = {
  fullyAllocated: number;
  partiallyAllocated: number;
  notAllocated: number;
};

const SEGMENTS = [
  {
    key: "fullyAllocated",
    label: "Fully Allocated",
    color: "var(--success)",
  },
  {
    key: "partiallyAllocated",
    label: "Partially Allocated",
    color: "var(--accent)",
  },
  {
    key: "notAllocated",
    label: "Not Allocated",
    color: "var(--border-strong)",
  },
] as const;

export default function ItemStatusChart(props: ItemStatusChartProps) {
  const data = SEGMENTS.map((segment) => ({
    name: segment.label,
    value: props[segment.key],
    color: segment.color,
  }));

  const total = data.reduce((sum, entry) => sum + entry.value, 0);

  if (total === 0) {
    return (
      <div className="flex h-56 flex-col items-center justify-center rounded-lg border border-dashed border-border text-center">
        <p className="text-sm font-medium text-primary">No items yet</p>

        <p className="mt-1 text-sm text-muted">
          Add an item and its status will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative h-44 w-44 shrink-0 overflow-visible">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="66%"
              outerRadius="100%"
              paddingAngle={2}
              stroke="none"
              startAngle={90}
              endAngle={-270}
              animationDuration={800}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>

            <Tooltip
              allowEscapeViewBox={{ x: true, y: true }}
              offset={12}
              cursor={false}
              wrapperStyle={{
                zIndex: 50,
                pointerEvents: "none",
              }}
              contentStyle={{
                borderRadius: 10,
                border: "1px solid var(--border)",
                backgroundColor: "var(--surface)",
                fontSize: 12,
                color: "var(--text-primary)",
                boxShadow: "var(--shadow-card-token)",
                padding: "8px 10px",
              }}
              formatter={(value, name) => [
                `${Number(value).toLocaleString("en-US")} items`,
                String(name),
              ]}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-primary">
            <Counter value={total} />
          </span>

          <span className="text-xs text-muted">Items</span>
        </div>
      </div>

      <ul className="w-full space-y-3">
        {data.map((entry) => (
          <li
            key={entry.name}
            className="flex items-center justify-between gap-3"
          >
            <span className="flex min-w-0 items-center gap-2 text-sm text-secondary">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: entry.color }}
              />

              <span className="truncate">{entry.name}</span>
            </span>

            <span className="shrink-0 text-sm font-semibold text-primary">
              {entry.value.toLocaleString("en-US")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}