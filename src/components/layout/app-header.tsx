"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  ChevronDown,
  LogOut,
  Search,
  Sparkles,
  UserCog,
} from "lucide-react";

import { authClient } from "@/lib/auth/auth-client";

import ThemeToggle from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import { transitions } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { AIAssistant } from "@/features/ai/components/ai-assistant";

export type HeaderAlert = {
  id: string;
  title: string;
  detail: string;
  href: string;
};

type AppHeaderProps = {
  name: string;
  email: string;
  role: "admin" | "staff";
  /** Real warnings: spaces nearly full, items with unallocated units. */
  alerts: HeaderAlert[];
};

const SECTION_TITLES: [string, string, string][] = [
  ["/dashboard", "Dashboard", "Overview of your warehouse operations"],
  ["/warehouses", "Warehouses", "Manage your warehouses"],
  [
    "/storage-spaces",
    "Storage Spaces",
    "Every storage space across warehouses",
  ],
  ["/items", "Items", "Manage your inventory items"],
  ["/allocations", "Allocations", "Where every unit of stock is stored"],
  ["/activity", "Activity Log", "Every stock movement, newest to oldest"],
  ["/users", "Users", "Accounts and what each role can do"],
  ["/settings", "Settings", "Your account and preferences"],
];

function sectionFor(pathname: string) {
  const match = SECTION_TITLES.find(
    ([href]) => pathname === href || pathname.startsWith(`${href}/`),
  );

  return match ?? ["", "Warehouse Management", ""];
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function AppHeader({
  name,
  email,
  role,
  alerts,
}: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [, title, description] = sectionFor(pathname);

  const [query, setQuery] = useState("");

  const [openPanel, setOpenPanel] = useState<
    "alerts" | "user" | "ai" | null
  >(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openPanel) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;

      const clickedInsideHeaderActions =
        containerRef.current?.contains(target);

      const clickedInsideAIDrawer =
        target instanceof Element &&
        target.closest("[data-ai-drawer]");

      if (!clickedInsideHeaderActions && !clickedInsideAIDrawer) {
        setOpenPanel(null);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenPanel(null);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openPanel]);

  async function handleLogout() {
    await authClient.signOut();

    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-6 py-3.5">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight text-primary">
            {title}
          </h1>

          {description && (
            <p className="truncate text-sm text-muted">{description}</p>
          )}
        </div>

        <div
          ref={containerRef}
          className="flex shrink-0 items-center gap-2"
        >
          <form
            className="relative hidden md:block"
            onSubmit={(event) => {
              event.preventDefault();

              const term = query.trim();

              router.push(
                term
                  ? `/items?search=${encodeURIComponent(term)}`
                  : "/items",
              );
            }}
          >
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />

            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search items..."
              aria-label="Search items"
              className="h-9 w-56 pl-9 lg:w-64"
            />
          </form>

          <button
            type="button"
            onClick={() =>
              setOpenPanel((value) =>
                value === "ai" ? null : "ai",
              )
            }
            aria-label="Ask Warehouse AI"
            aria-expanded={openPanel === "ai"}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-secondary transition-colors hover:bg-neutral-muted hover:text-primary",
              openPanel === "ai" &&
                "bg-neutral-muted text-primary",
            )}
          >
            <Sparkles className="h-4 w-4" />

            <span className="hidden lg:inline">
              Ask AI
            </span>
          </button>

          <ThemeToggle />

          <div className="relative">
            <button
              type="button"
              aria-label={`Alerts (${alerts.length})`}
              aria-expanded={openPanel === "alerts"}
              onClick={() =>
                setOpenPanel((value) =>
                  value === "alerts" ? null : "alerts",
                )
              }
              className={cn(
                "relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-secondary transition-colors hover:bg-neutral-muted hover:text-primary",
                openPanel === "alerts" &&
                  "bg-neutral-muted text-primary",
              )}
            >
              <Bell className="h-[18px] w-[18px]" />

              {alerts.length > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-60" />

                  <span className="relative inline-flex h-2 w-2 rounded-full bg-danger" />
                </span>
              )}
            </button>

            <AnimatePresence>
              {openPanel === "alerts" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: -4 }}
                  transition={transitions.fast}
                  className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-surface shadow-popover"
                >
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-sm font-semibold text-primary">
                      Things to look at
                    </p>
                  </div>

                  {alerts.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-muted">
                      Nothing needs attention right now.
                    </p>
                  ) : (
                    <ul className="max-h-80 overflow-y-auto">
                      {alerts.map((alert) => (
                        <li key={alert.id}>
                          <Link
                            href={alert.href}
                            onClick={() => setOpenPanel(null)}
                            className="block border-b border-border px-4 py-3 transition-colors last:border-0 hover:bg-surface-subtle"
                          >
                            <p className="text-sm font-medium text-primary">
                              {alert.title}
                            </p>

                            <p className="mt-0.5 text-xs text-muted">
                              {alert.detail}
                            </p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={openPanel === "user"}
              onClick={() =>
                setOpenPanel((value) =>
                  value === "user" ? null : "user",
                )
              }
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg py-1 pr-2 pl-1 transition-colors hover:bg-neutral-muted",
                openPanel === "user" &&
                  "bg-neutral-muted",
              )}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
                {initials(name)}
              </span>

              <span className="hidden text-left sm:block">
                <span className="block text-sm leading-tight font-medium text-primary">
                  {name}
                </span>

                <span className="block text-xs leading-tight text-muted">
                  {role === "admin" ? "Admin" : "Staff"}
                </span>
              </span>

              <ChevronDown className="h-4 w-4 text-muted" />
            </button>

            <AnimatePresence>
              {openPanel === "user" && (
                <motion.div
                  role="menu"
                  initial={{ opacity: 0, scale: 0.96, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: -4 }}
                  transition={transitions.fast}
                  className="absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-surface shadow-popover"
                >
                  <div className="border-b border-border px-4 py-3">
                    <p className="truncate text-sm font-medium text-primary">
                      {name}
                    </p>

                    <p className="truncate text-xs text-muted">
                      {email}
                    </p>
                  </div>

                  <Link
                    href="/settings"
                    role="menuitem"
                    onClick={() => setOpenPanel(null)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-secondary transition-colors hover:bg-surface-subtle hover:text-primary"
                  >
                    <UserCog className="h-4 w-4" />
                    Account settings
                  </Link>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full cursor-pointer items-center gap-2.5 border-t border-border px-4 py-2.5 text-left text-sm text-danger transition-colors hover:bg-danger-muted"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AIAssistant
        open={openPanel === "ai"}
        onClose={() => setOpenPanel(null)}
      />
    </header>
  );
}