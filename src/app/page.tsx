import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeftRight,
  BarChart3,
  Bell,
  Box,
  Check,
  ChevronRight,
  ClipboardList,
  LayoutGrid,
  Moon,
  Package,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Warehouse,
} from "lucide-react";

import Button from "@/components/ui/button";
import ThemeToggle from "@/components/theme-toggle";

const features = [
  {
    title: "Warehouse Management",
    description:
      "Create and manage warehouses with location, status and capacity information.",
    icon: Warehouse,
  },
  {
    title: "Inventory Management",
    description:
      "Track item quantities, availability and current storage locations in one place.",
    icon: Box,
  },
  {
    title: "Storage Spaces",
    description:
      "Organize each warehouse into manageable storage areas and monitor capacity.",
    icon: LayoutGrid,
  },
  {
    title: "Smart Allocations",
    description:
      "Allocate inventory across storage spaces, including split allocations.",
    icon: ArrowLeftRight,
  },
  {
    title: "Capacity Tracking",
    description:
      "Monitor total, used and available capacity at warehouse and storage level.",
    icon: BarChart3,
  },
  {
    title: "Role-Based Access",
    description:
      "Control system access based on administrator and staff responsibilities.",
    icon: Users,
  },
];

const steps = [
  {
    number: "01",
    title: "Create Warehouse",
    description:
      "Set up warehouses with location, status and capacity.",
    icon: Warehouse,
  },
  {
    number: "02",
    title: "Add Storage Spaces",
    description:
      "Organize each warehouse into manageable storage areas.",
    icon: LayoutGrid,
  },
  {
    number: "03",
    title: "Add Inventory",
    description:
      "Create items and maintain their quantities and details.",
    icon: Box,
  },
  {
    number: "04",
    title: "Allocate Stock",
    description:
      "Place inventory into storage spaces and track movements.",
    icon: ArrowLeftRight,
  },
];

const aiFeatures = [
  {
    title: "AI Warehouse Assistant",
    description:
      "Ask natural-language questions about inventory, locations and capacity.",
    icon: Sparkles,
  },
  {
    title: "AI Form Assistance",
    description:
      "Use natural language to prepare useful item and form suggestions.",
    icon: Box,
  },
  {
    title: "Warehouse Analysis",
    description:
      "Analyze utilization, available capacity and unallocated inventory.",
    icon: BarChart3,
  },
];

const dashboardNavigation = [
  { label: "Dashboard", icon: BarChart3, active: true },
  { label: "Warehouses", icon: Warehouse },
  { label: "Storage Spaces", icon: LayoutGrid },
  { label: "Items", icon: Box },
  { label: "Allocations", icon: ArrowLeftRight },
  { label: "Users", icon: Users },
  { label: "Activity Log", icon: ClipboardList },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link
            href="/"
            className="flex items-center gap-3"
            aria-label="WMS home"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
              <Package className="h-5 w-5 text-white" />
            </div>

            <div className="min-w-0">
              <p className="text-lg font-bold leading-none text-primary">
                WMS
              </p>

              <p className="mt-1 text-[11px] text-muted">
                Warehouse Management
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <a
              href="#features"
              className="text-sm text-secondary transition-colors hover:text-primary"
            >
              Features
            </a>

            <a
              href="#how-it-works"
              className="text-sm text-secondary transition-colors hover:text-primary"
            >
              How it works
            </a>

            <a
              href="#ai"
              className="text-sm text-secondary transition-colors hover:text-primary"
            >
              AI
            </a>

            <a
              href="#security"
              className="text-sm text-secondary transition-colors hover:text-primary"
            >
              Security
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            <Button href="/login" variant="secondary" size="sm">
              Login
            </Button>

            <Button href="/login" size="sm">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-6 pb-14 pt-14 lg:pb-16 lg:pt-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center rounded-full border border-border bg-background px-4 py-2 text-xs font-medium text-secondary">
              <Package className="mr-2 h-4 w-4" />
              WMS · Warehouse Management System
            </div>

            <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-[54px] lg:leading-[1.08]">
              Manage your warehouse.
              <span className="mt-1 block text-secondary">
                Know where everything is.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-secondary sm:text-lg">
              A centralized system for managing warehouses, storage spaces,
              inventory, allocations and capacity from one place.
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Button href="/login">Get Started</Button>

              <Button href="#features" variant="secondary">
                Explore Features
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" />
                Multi-warehouse
              </span>

              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" />
                Split allocation
              </span>

              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5" />
                Role-based access
              </span>
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="mx-auto mt-12 max-w-6xl">
            <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-card">
              <div className="flex h-[430px] sm:h-[455px]">
                <aside className="hidden w-40 shrink-0 flex-col bg-[#1f2b3d] sm:flex lg:w-44">
                  <div className="flex items-center gap-2 px-3.5 py-4">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent">
                      <Package className="h-3.5 w-3.5 text-white" />
                    </div>

                    <div>
                      <p className="text-xs font-bold leading-none text-white">
                        WMS
                      </p>

                      <p className="mt-1 text-[7px] text-slate-300">
                        Warehouse Management
                      </p>
                    </div>
                  </div>

                  <nav className="flex-1 px-2">
                    <div className="space-y-0.5">
                      {dashboardNavigation.map((item) => {
                        const Icon = item.icon;

                        return (
                          <div
                            key={item.label}
                            className={[
                              "flex items-center gap-2 rounded-md px-2 py-1.5 text-[9px] font-medium",
                              item.active
                                ? "bg-accent text-white"
                                : "text-slate-300",
                            ].join(" ")}
                          >
                            <Icon className="h-3 w-3 shrink-0" />
                            <span>{item.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </nav>

                  <div className="border-t border-white/10 px-2.5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[8px] font-semibold text-white">
                        A
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-[9px] font-medium text-white">
                          Admin
                        </p>

                        <p className="truncate text-[7px] text-slate-400">
                          Administrator
                        </p>
                      </div>
                    </div>
                  </div>
                </aside>

                <div className="min-w-0 flex-1 bg-[#f4f7fb]">
                  <div className="flex h-11 items-center justify-between border-b border-border bg-surface px-3 sm:px-4">
                    <div>
                      <p className="text-xs font-semibold text-primary">
                        Dashboard
                      </p>

                      <p className="text-[7px] text-muted">
                        Overview of your warehouse operations
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="hidden h-7 w-32 items-center gap-1.5 rounded-md border border-border bg-background px-2 md:flex">
                        <Search className="h-3 w-3 text-muted" />

                        <span className="text-[8px] text-muted">
                          Search items...
                        </span>
                      </div>

                      <div className="hidden items-center gap-1 text-[8px] text-secondary md:flex">
                        <Sparkles className="h-3 w-3" />
                        Ask AI
                      </div>

                      <Moon className="h-3 w-3 text-secondary" />

                      <div className="relative">
                        <Bell className="h-3 w-3 text-secondary" />

                        <span className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-red-500" />
                      </div>

                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[8px] font-semibold text-white">
                        A
                      </div>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-primary">
                          Welcome back, Admin
                        </p>

                        <p className="mt-1 max-w-2xl text-[7px] leading-3 text-muted">
                          1 of 1 warehouses are active, 0% of the storage space
                          is used, and 1,000 of 1,000 units are still waiting
                          for a storage space.
                        </p>
                      </div>

                      <button
                        type="button"
                        className="hidden shrink-0 items-center gap-1 rounded-md border border-border bg-surface px-2 py-1.5 text-[7px] font-medium text-primary shadow-sm sm:inline-flex"
                      >
                        <Sparkles className="h-3 w-3 text-accent" />
                        Analyze
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
                      <div className="rounded-lg border border-border bg-surface p-2.5 shadow-sm">
                        <div className="flex items-center gap-1.5">
                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50">
                            <Warehouse className="h-3 w-3 text-accent" />
                          </div>

                          <span className="text-[7px] text-muted">
                            Total Warehouses
                          </span>
                        </div>

                        <p className="mt-1.5 text-base font-bold text-primary">
                          1
                        </p>

                        <p className="mt-0.5 text-[6px] text-emerald-600">
                          ↗ +1 this month
                        </p>
                      </div>

                      <div className="rounded-lg border border-border bg-surface p-2.5 shadow-sm">
                        <div className="flex items-center gap-1.5">
                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50">
                            <LayoutGrid className="h-3 w-3 text-accent" />
                          </div>

                          <span className="text-[7px] text-muted">
                            Storage Spaces
                          </span>
                        </div>

                        <p className="mt-1.5 text-base font-bold text-primary">
                          2
                        </p>

                        <p className="mt-0.5 text-[6px] text-emerald-600">
                          ↗ +2 this month
                        </p>
                      </div>

                      <div className="rounded-lg border border-border bg-surface p-2.5 shadow-sm">
                        <div className="flex items-center gap-1.5">
                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-50">
                            <Box className="h-3 w-3 text-amber-600" />
                          </div>

                          <span className="text-[7px] text-muted">
                            Total Items
                          </span>
                        </div>

                        <p className="mt-1.5 text-base font-bold text-primary">
                          1
                        </p>

                        <p className="mt-0.5 text-[6px] text-emerald-600">
                          ↗ +1 this month
                        </p>
                      </div>

                      <div className="rounded-lg border border-border bg-surface p-2.5 shadow-sm">
                        <div className="flex items-center gap-1.5">
                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50">
                            <ArrowLeftRight className="h-3 w-3 text-emerald-600" />
                          </div>

                          <span className="text-[7px] text-muted">
                            Movements
                          </span>
                        </div>

                        <p className="mt-1.5 text-base font-bold text-primary">
                          0
                        </p>

                        <p className="mt-0.5 text-[6px] text-muted">
                          no movements this week
                        </p>
                      </div>
                    </div>

                    <div className="mt-2.5 overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
                      <div className="flex items-center justify-between border-b border-border px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-50">
                            <AlertTriangle className="h-3 w-3 text-amber-600" />
                          </div>

                          <div>
                            <p className="text-[8px] font-semibold text-primary">
                              Things to look at
                            </p>

                            <p className="text-[6px] text-muted">
                              Spaces running out of room and stock without a
                              place yet.
                            </p>
                          </div>
                        </div>

                        <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[6px] font-medium text-amber-700">
                          1 issue
                        </span>
                      </div>

                      <div className="flex items-center gap-2 px-3 py-2">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-50">
                          <Package className="h-3 w-3 text-accent" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-[8px] font-medium text-primary">
                            1,000 units waiting to be allocated
                          </p>

                          <p className="text-[6px] text-muted">
                            Across 1 item with no storage space yet
                          </p>
                        </div>

                        <button
                          type="button"
                          className="hidden rounded-md border border-border px-2 py-1 text-[6px] font-medium text-secondary sm:block"
                        >
                          Allocate
                        </button>

                        <ChevronRight className="h-3 w-3 text-muted" />
                      </div>
                    </div>

                    <div className="mt-2.5 grid gap-2.5 lg:grid-cols-[1.45fr_1fr]">
                      <div className="rounded-lg border border-border bg-surface p-3 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-[8px] font-semibold text-primary">
                              Overall storage capacity
                            </p>

                            <p className="mt-0.5 text-[6px] text-muted">
                              0 / 3,500 units
                            </p>
                          </div>

                          <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[6px] font-medium text-accent">
                            0% used
                          </span>
                        </div>

                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full w-0 rounded-full bg-accent" />
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <div className="rounded-md bg-background p-2">
                            <div className="flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-accent" />

                              <span className="text-[6px] text-muted">
                                Used capacity
                              </span>
                            </div>

                            <p className="mt-1 text-xs font-bold text-primary">
                              0
                            </p>
                          </div>

                          <div className="rounded-md bg-background p-2">
                            <div className="flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />

                              <span className="text-[6px] text-muted">
                                Available capacity
                              </span>
                            </div>

                            <p className="mt-1 text-xs font-bold text-primary">
                              3,500
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 border-t border-border pt-2.5">
                          <p className="text-[7px] font-semibold text-primary">
                            Capacity per warehouse
                          </p>

                          <div className="mt-2 flex h-10 items-end gap-1.5">
                            <div className="h-[20%] flex-1 rounded-t bg-blue-100" />
                            <div className="h-[35%] flex-1 rounded-t bg-blue-100" />
                            <div className="h-[50%] flex-1 rounded-t bg-blue-100" />
                            <div className="h-[30%] flex-1 rounded-t bg-blue-100" />
                            <div className="h-[65%] flex-1 rounded-t bg-blue-100" />
                            <div className="h-[42%] flex-1 rounded-t bg-blue-100" />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border border-border bg-surface p-3 shadow-sm">
                        <div>
                          <p className="text-[8px] font-semibold text-primary">
                            Items by status
                          </p>

                          <p className="mt-0.5 text-[6px] text-muted">
                            How much of each item has a storage space.
                          </p>
                        </div>

                        <div className="mt-3 flex items-center gap-3">
                          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-200">
                            <div className="absolute inset-[10px] flex items-center justify-center rounded-full bg-surface">
                              <div className="text-center">
                                <p className="text-xs font-bold text-primary">
                                  1
                                </p>

                                <p className="text-[5px] text-muted">Items</p>
                              </div>
                            </div>
                          </div>

                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="flex items-center gap-1.5 text-[6px] text-secondary">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                                Fully Allocated
                              </span>

                              <span className="text-[7px] font-semibold text-primary">
                                0
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <span className="flex items-center gap-1.5 text-[6px] text-secondary">
                                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                                Partially Allocated
                              </span>

                              <span className="text-[7px] font-semibold text-primary">
                                0
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <span className="flex items-center gap-1.5 text-[6px] text-secondary">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                                Not Allocated
                              </span>

                              <span className="text-[7px] font-semibold text-primary">
                                1
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-3 text-center text-[10px] text-muted">
              A preview of the WMS operational dashboard
            </p>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-muted">
            Core capabilities
          </p>

          <h2 className="mt-3 text-2xl font-semibold text-primary sm:text-3xl">
            Everything you need to manage inventory
          </h2>

          <p className="mt-4 text-base leading-7 text-secondary">
            Manage the complete inventory flow from warehouse creation to
            storage allocation and movement.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="group rounded-xl border border-border bg-surface p-6 shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-accent/30"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background transition-colors group-hover:bg-accent/10">
                  <Icon className="h-5 w-5 text-secondary" />
                </div>

                <h3 className="mt-5 text-base font-semibold text-primary">
                  {feature.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-secondary">
                  {feature.description}
                </p>

                <div className="mt-5 flex items-center text-xs font-medium text-muted">
                  Learn more
                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section
        id="how-it-works"
        className="border-y border-border bg-surface"
      >
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted">
              How it works
            </p>

            <h2 className="mt-3 text-2xl font-semibold text-primary sm:text-3xl">
              From warehouse to allocation
            </h2>

            <p className="mt-4 text-base leading-7 text-secondary">
              A straightforward operational flow keeps inventory organized and
              traceable.
            </p>
          </div>

          <div className="relative mt-14 grid gap-5 md:grid-cols-4">
            <div className="absolute left-[12%] right-[12%] top-10 hidden h-px bg-border md:block" />

            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.number}
                  className="relative z-10 text-center"
                >
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-background shadow-card">
                    <Icon className="h-6 w-6 text-secondary" />
                  </div>

                  <p className="mt-5 text-xs font-semibold tracking-wider text-muted">
                    {step.number}
                  </p>

                  <h3 className="mt-2 text-base font-semibold text-primary">
                    {step.title}
                  </h3>

                  <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-secondary">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="ai" className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-secondary">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Intelligent Operations
              </div>

              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
                Work with your warehouse data using AI.
              </h2>

              <p className="mt-5 text-base leading-7 text-secondary">
                Ask questions in natural language, get useful suggestions
                while creating records and analyze warehouse operations without
                manually searching through every screen.
              </p>

              <div className="mt-7 space-y-4">
                {aiFeatures.map((feature) => {
                  const Icon = feature.icon;

                  return (
                    <div key={feature.title} className="flex gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface">
                        <Icon className="h-4 w-4 text-secondary" />
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-primary">
                          {feature.title}
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-secondary">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI assistant preview */}
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-card sm:p-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-primary">
                      AI Warehouse Assistant
                    </p>

                    <p className="text-[11px] text-muted">
                      Ask about your warehouse
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-background px-2.5 py-1 text-[10px] font-medium text-muted">
                  Read-only
                </span>
              </div>

              <div className="space-y-5 py-6">
                <div className="ml-auto max-w-[85%] rounded-xl rounded-br-sm bg-background p-4">
                  <p className="text-xs leading-5 text-primary">
                    Which storage spaces are nearly full?
                  </p>
                </div>

                <div className="max-w-[90%] rounded-xl rounded-bl-sm border border-border bg-background p-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-secondary" />

                    <p className="text-xs font-semibold text-primary">
                      WMS Assistant
                    </p>
                  </div>

                  <p className="mt-3 text-xs leading-6 text-secondary">
                    I found 3 storage spaces currently operating above 80%
                    capacity.
                  </p>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between rounded-lg border border-border p-3">
                      <span className="text-xs text-primary">
                        Storage A-01
                      </span>

                      <span className="text-xs font-semibold text-primary">
                        94%
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-border p-3">
                      <span className="text-xs text-primary">
                        Storage B-03
                      </span>

                      <span className="text-xs font-semibold text-primary">
                        89%
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-border p-3">
                      <span className="text-xs text-primary">
                        Storage C-02
                      </span>

                      <span className="text-xs font-semibold text-primary">
                        84%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-2">
                <div className="flex-1 px-2 text-xs text-muted">
                  Ask something about your warehouse...
                </div>

                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent">
                  <ChevronRight className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="security"
        className="border-b border-border bg-surface"
      >
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted">
              Access control
            </p>

            <h2 className="mt-3 text-2xl font-semibold text-primary sm:text-3xl">
              Built for controlled warehouse operations
            </h2>

            <p className="mt-4 text-base leading-7 text-secondary">
              Keep operational access aligned with responsibilities through
              role-based permissions.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-background p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>

                <div>
                  <h3 className="text-base font-semibold text-primary">
                    Administrator
                  </h3>

                  <p className="text-xs text-muted">
                    System-level access
                  </p>
                </div>
              </div>

              <ul className="mt-6 space-y-3">
                {[
                  "Manage users and roles",
                  "Manage warehouses and storage",
                  "Manage inventory operations",
                  "Access activity and system information",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-secondary"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-border bg-background p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface">
                  <Users className="h-5 w-5 text-secondary" />
                </div>

                <div>
                  <h3 className="text-base font-semibold text-primary">
                    Staff
                  </h3>

                  <p className="text-xs text-muted">
                    Operational access
                  </p>
                </div>
              </div>

              <ul className="mt-6 space-y-3">
                {[
                  "Manage day-to-day inventory",
                  "Allocate and move stock",
                  "View warehouse information",
                  "Access permitted operational screens",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-secondary"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
            <Package className="h-6 w-6 text-white" />
          </div>

          <h2 className="mt-6 text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
            Ready to manage your warehouse?
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-secondary">
            Access WMS and manage your warehouses, inventory, storage capacity
            and stock operations from one place.
          </p>

          <div className="mt-8 flex justify-center">
            <Button href="/login">Access WMS</Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-7 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent">
              <Package className="h-3.5 w-3.5 text-white" />
            </div>

            <span>© 2026 WMS · Warehouse Management</span>
          </div>

          <div className="flex items-center gap-5">
            <a
              href="#features"
              className="transition-colors hover:text-primary"
            >
              Features
            </a>

            <a
              href="#ai"
              className="transition-colors hover:text-primary"
            >
              AI
            </a>

            <Link
              href="/login"
              className="transition-colors hover:text-primary"
            >
              Login
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}