"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import Counter from "@/components/motion/counter";

type InventoryDistributionChartProps = {
  data: Array<{
    name: string;
    quantity: number;
  }>;
};

const COLORS = [
  "var(--accent)",
  "var(--success)",
  "var(--warning)",
  "var(--danger)",
  "var(--border-strong)",
];

export default function InventoryDistributionChart({
  data,
}: InventoryDistributionChartProps) {
  const total = data.reduce((sum, entry) => sum + entry.quantity, 0);

  if (data.length === 0 || total === 0) {
    return (
      <div className="flex h-44 flex-col items-center justify-center rounded-lg border border-dashed border-border text-center">
        <p className="text-sm font-medium text-primary">
          No stock is allocated yet
        </p>

        <p className="mt-1 text-sm text-muted">
          Allocate an item to a storage space and it will appear here.
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
              dataKey="quantity"
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
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${entry.name}`}
                  fill={COLORS[index % COLORS.length]}
                />
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
                `${Number(value).toLocaleString("en-US")} units`,
                String(name),
              ]}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-primary">
            <Counter value={total} />
          </span>

          <span className="text-xs text-muted">Units</span>
        </div>
      </div>

      <ul className="w-full space-y-3">
        {data.map((entry, index) => (
          <li
            key={entry.name}
            className="flex items-center justify-between gap-3"
          >
            <span className="flex min-w-0 items-center gap-2 text-sm text-secondary">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{
                  background: COLORS[index % COLORS.length],
                }}
              />

              <span className="truncate">{entry.name}</span>
            </span>

            <span className="shrink-0 text-right">
              <span className="block text-sm font-semibold text-primary">
                {entry.quantity.toLocaleString("en-US")}
              </span>

              <span className="block text-xs text-muted">
                {Math.round((entry.quantity / total) * 100)}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}