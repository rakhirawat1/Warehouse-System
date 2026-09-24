"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  CircleAlert,
  Gauge,
  Layers,
  PackageOpen,
  PowerOff,
  RotateCcw,
  Sparkles,
  Split,
  TriangleAlert,
  X,
} from "lucide-react";

import { summarizeWarehouseAction } from "../actions";
import type { HealthTone, WarehouseHealth } from "../assist";
import Button from "@/components/ui/button";
import Progress from "@/components/ui/progress";
import { collapseVariants, riseItem, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; data: WarehouseHealth };

const TONE = {
  good: {
    label: "Healthy",
    pill: "bg-success-muted text-success",
    tile: "bg-success-muted text-success",
    ring: "border-success/30",
    icon: CheckCircle2,
  },
  watch: {
    label: "Keep an eye on",
    pill: "bg-warning-muted text-warning",
    tile: "bg-warning-muted text-warning",
    ring: "border-warning/30",
    icon: CircleAlert,
  },
  action: {
    label: "Needs action",
    pill: "bg-danger-muted text-danger",
    tile: "bg-danger-muted text-danger",
    ring: "border-danger/30",
    icon: TriangleAlert,
  },
} satisfies Record<HealthTone, unknown>;

const n = (value: number) => value.toLocaleString("en-US");

/** Health report. Numbers and names come from the database; the AI only writes the text. */
export default function WarehouseHealthSummary() {
  const [state, setState] = useState<State>({ status: "idle" });

  async function analyze() {
    setState({ status: "loading" });

    const result = await summarizeWarehouseAction();

    setState(
      result.ok
        ? { status: "done", data: result.data }
        : { status: "error", message: result.error },
    );
  }

  const open = state.status !== "idle";

  return (
    <div className="mb-6">
      {!open && (
        <Button
          type="button"
          variant="secondary"
          icon={<Sparkles className="h-4 w-4 text-accent" />}
          onClick={analyze}
        >
          Analyze Warehouse
        </Button>
      )}

      <AnimatePresence>
        {open && (
          <motion.section
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={collapseVariants}
            className="overflow-hidden rounded-xl border border-border bg-surface shadow-card"
          >
            <Header
              state={state}
              onRefresh={analyze}
              onClose={() => setState({ status: "idle" })}
            />

            <div className="p-5">
              {state.status === "loading" && <LoadingReport />}

              {state.status === "error" && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-lg border border-danger/20 bg-danger-muted p-4"
                >
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-danger" />

                  <div>
                    <p className="text-sm font-medium text-danger">
                      The analysis could not be completed
                    </p>

                    <p className="mt-1 text-sm text-danger/90">
                      {state.message}
                    </p>
                  </div>
                </div>
              )}

              {state.status === "done" && <Report data={state.data} />}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

function Header({
  state,
  onRefresh,
  onClose,
}: {
  state: State;
  onRefresh: () => void;
  onClose: () => void;
}) {
  const tone =
    state.status === "done" ? TONE[state.data.narrative.overallStatus] : null;
  const ToneIcon = tone?.icon;

  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent">
          <Sparkles className="h-5 w-5" />
        </span>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-primary">Warehouse health</h3>

            {tone && ToneIcon && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  tone.pill,
                )}
              >
                <ToneIcon className="h-3.5 w-3.5" />
                {tone.label}
              </span>
            )}
          </div>

          <p className="mt-0.5 text-sm text-secondary">
            {state.status === "done"
              ? state.data.narrative.headline
              : state.status === "loading"
                ? "Reading live warehouse data..."
                : "AI analysis of your live warehouse data"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        {state.status !== "loading" && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={<RotateCcw className="h-4 w-4" />}
            onClick={onRefresh}
          >
            Refresh
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Close report"
          icon={<X className="h-4 w-4" />}
          onClick={onClose}
          disabled={state.status === "loading"}
        />
      </div>
    </div>
  );
}

function Report({ data }: { data: WarehouseHealth }) {
  const { metrics, narrative } = data;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-5"
    >
      {/* Key figures, straight from the database */}
      <motion.div
        variants={riseItem}
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <Metric
          icon={<Gauge className="h-4 w-4" />}
          label="Utilisation"
          value={`${metrics.usedPercent}%`}
          detail={`${n(metrics.usedCapacity)} of ${n(metrics.totalCapacity)} units`}
        >
          <Progress
            value={metrics.usedCapacity}
            max={Math.max(metrics.totalCapacity, 1)}
            size="sm"
            className="mt-2"
          />
        </Metric>

        <Metric
          icon={<Boxes className="h-4 w-4" />}
          label="Free capacity"
          value={n(metrics.availableCapacity)}
          detail="units inside storage spaces"
        />

        <Metric
          icon={<PackageOpen className="h-4 w-4" />}
          label="Waiting to allocate"
          value={n(metrics.unallocatedUnits)}
          detail={`of ${n(metrics.unitsOwned)} units owned`}
        />

        <Metric
          icon={<Layers className="h-4 w-4" />}
          label="Active warehouses"
          value={`${metrics.activeWarehouses} / ${metrics.totalWarehouses}`}
          detail={
            metrics.inactiveWarehouses.length > 0
              ? `${metrics.inactiveWarehouses.length} inactive`
              : "all active"
          }
        />
      </motion.div>

      {/* One card per area: AI status and note, real names as chips */}
      <motion.div
        variants={riseItem}
        className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
      >
        <Area
          icon={<Gauge className="h-4 w-4" />}
          title="Utilisation & capacity"
          section={narrative.sections.utilisation}
        />

        <Area
          icon={<PackageOpen className="h-4 w-4" />}
          title="Unallocated stock"
          section={narrative.sections.unallocated}
          chips={metrics.unallocatedItems.map((item) => ({
            label: item.name,
            value: `${n(item.remaining)} left`,
          }))}
          href="/items?filter=unallocated"
          linkLabel="Allocate stock"
        />

        <Area
          icon={<TriangleAlert className="h-4 w-4" />}
          title="Nearly full spaces"
          section={narrative.sections.nearlyFull}
          chips={metrics.nearlyFull.map((space) => ({
            label: `${space.name} · ${space.warehouse}`,
            value: `${space.usedPercent}%`,
          }))}
          href="/storage-spaces"
          linkLabel="View storage spaces"
        />

        <Area
          icon={<PowerOff className="h-4 w-4" />}
          title="Inactive warehouses"
          section={narrative.sections.inactive}
          chips={metrics.inactiveWarehouses.map((warehouse) => ({
            label: warehouse.name,
            value: `${n(warehouse.unitsInside)} units inside`,
          }))}
          href="/warehouses"
          linkLabel="View warehouses"
        />

        <Area
          icon={<Split className="h-4 w-4" />}
          title="Split across locations"
          section={narrative.sections.split}
          chips={metrics.splitItems.map((item) => ({
            label: item.item,
            value: `${item.locations} spaces`,
          }))}
          href="/allocations"
          linkLabel="View allocations"
        />

        {/* Recommendations fill the last cell of the grid */}
        <div className="rounded-xl border border-accent/25 bg-accent-muted/50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Sparkles className="h-4 w-4 text-accent" />
            Recommended next steps
          </p>

          <ol className="mt-3 space-y-2.5">
            {narrative.recommendations.map((recommendation, index) => (
              <li key={recommendation} className="flex gap-2.5 text-sm">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-white">
                  {index + 1}
                </span>

                <span className="text-secondary">{recommendation}</span>
              </li>
            ))}
          </ol>
        </div>
      </motion.div>

      <motion.p variants={riseItem} className="text-xs text-muted">
        Figures come straight from the database; the wording is AI-generated at{" "}
        {new Date(data.generatedAt).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        })}
        . Read-only: nothing was changed.
      </motion.p>
    </motion.div>
  );
}

function Metric({
  icon,
  label,
  value,
  detail,
  children,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-subtle p-3.5">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
        {icon}
        {label}
      </p>

      <p className="mt-1.5 text-xl font-bold tracking-tight text-primary">
        {value}
      </p>

      <p className="text-xs text-muted">{detail}</p>

      {children}
    </div>
  );
}

function Area({
  icon,
  title,
  section,
  chips = [],
  href,
  linkLabel,
}: {
  icon: ReactNode;
  title: string;
  section: { status: HealthTone; note: string };
  chips?: { label: string; value: string }[];
  href?: string;
  linkLabel?: string;
}) {
  const tone = TONE[section.status];
  const shown = chips.slice(0, 4);

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border bg-surface p-4",
        section.status === "good" ? "border-border" : tone.ring,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-primary">
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md",
              tone.tile,
            )}
          >
            {icon}
          </span>
          {title}
        </p>

        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
            tone.pill,
          )}
        >
          {tone.label}
        </span>
      </div>

      <p className="mt-2.5 text-sm leading-relaxed text-secondary">
        {section.note}
      </p>

      {shown.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {shown.map((chip) => (
            <li
              key={chip.label}
              className="flex items-center justify-between gap-3 rounded-md bg-surface-subtle px-2.5 py-1.5 text-xs"
            >
              <span className="truncate text-secondary">{chip.label}</span>
              <span className="shrink-0 font-semibold text-primary">
                {chip.value}
              </span>
            </li>
          ))}

          {chips.length > shown.length && (
            <li className="px-2.5 text-xs text-muted">
              and {chips.length - shown.length} more
            </li>
          )}
        </ul>
      )}

      {href && linkLabel && section.status !== "good" && (
        <Link
          href={href}
          className="group mt-auto inline-flex items-center gap-1 pt-3 text-xs font-medium text-accent"
        >
          {linkLabel}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

/** Skeleton in the same shape as the report, so nothing jumps on load. */
function LoadingReport() {
  return (
    <div className="space-y-5" aria-live="polite" aria-busy="true">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <div
            key={key}
            className="shimmer h-[88px] rounded-lg border border-border bg-surface-subtle"
          />
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((key) => (
          <div
            key={key}
            className="shimmer h-36 rounded-xl border border-border bg-surface-subtle"
          />
        ))}
      </div>
    </div>
  );
}
