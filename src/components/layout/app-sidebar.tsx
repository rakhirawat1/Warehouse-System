"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  Boxes,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  LayoutGrid,
  Package,
  Settings,
  Users,
} from "lucide-react";

import { transitions } from "@/lib/motion";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  role: "admin" | "staff";
  name: string;
  email: string;
};

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/warehouses",
    label: "Warehouses",
    icon: Boxes,
  },
  {
    href: "/storage-spaces",
    label: "Storage Spaces",
    icon: LayoutGrid,
  },
  {
    href: "/items",
    label: "Items",
    icon: Package,
  },
  {
    href: "/allocations",
    label: "Allocations",
    icon: ArrowLeftRight,
  },
  {
    href: "/users",
    label: "Users",
    icon: Users,
    adminOnly: true,
  },
  {
    href: "/activity",
    label: "Activity Log",
    icon: ClipboardList,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function AppSidebar({
  role,
  name,
  email,
}: AppSidebarProps) {
  const pathname = usePathname();
  const isAdmin = role === "admin";

  const [collapsed, setCollapsed] = useState(false);

  // The main content reads this width to stay aligned with the sidebar.
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      collapsed ? "72px" : "256px",
    );

    return () => {
      document.documentElement.style.removeProperty(
        "--sidebar-width",
      );
    };
  }, [collapsed]);

  return (
    <motion.aside
      initial={false}
      animate={{
        width: collapsed ? 72 : 256,
      }}
      transition={transitions.base}
      className="fixed inset-y-0 left-0 z-40 flex flex-col overflow-visible bg-sidebar"
    >
      <div
        className={cn(
          "flex h-[76px] shrink-0 items-center border-b border-white/10",
          collapsed ? "justify-center px-2" : "px-5",
        )}
      >
        <Link
          href="/dashboard"
          aria-label="WMS Dashboard"
          title={collapsed ? "WMS Dashboard" : undefined}
          className={cn(
            "flex min-w-0 items-center",
            collapsed ? "justify-center" : "gap-3",
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent">
            <Package className="h-5 w-5 text-white" />
          </div>

          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="min-w-0"
            >
              <p className="text-lg leading-none font-bold text-white">
                WMS
              </p>

              <p className="mt-1 truncate text-[11px] text-sidebar-muted">
                Warehouse Management
              </p>
            </motion.div>
          )}
        </Link>
      </div>

      <nav
        className={cn(
          "flex-1 overflow-y-auto py-4",
          collapsed ? "px-2" : "px-3",
        )}
      >
        <ul className="space-y-1">
          {NAV_ITEMS.filter(
            (item) => !item.adminOnly || isAdmin,
          ).map((item) => {
            const Icon = item.icon;

            const isActive =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "relative flex h-11 items-center rounded-lg text-sm font-medium transition-colors",
                    collapsed
                      ? "mx-auto w-11 justify-center px-0"
                      : "gap-3 px-3",
                    isActive
                      ? "text-white"
                      : "text-sidebar-text hover:bg-white/5 hover:text-white",
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active"
                      transition={transitions.indicator}
                      className="absolute inset-0 rounded-lg bg-sidebar-active"
                    />
                  )}

                  <Icon className="relative h-[18px] w-[18px] shrink-0" />

                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.12 }}
                      className="relative truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3">
        <Link
          href="/settings"
          title={collapsed ? `${name} · ${email}` : undefined}
          className={cn(
            "flex items-center rounded-lg transition-colors hover:bg-white/5",
            collapsed ? "justify-center p-2" : "gap-3 p-2",
          )}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
            {initials(name)}
          </span>

          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.12 }}
              className="min-w-0"
            >
              <span className="block truncate text-sm font-medium text-white">
                {name}
              </span>

              <span className="block truncate text-xs text-sidebar-muted">
                {isAdmin ? "Admin" : "Staff"} · {email}
              </span>
            </motion.span>
          )}
        </Link>
      </div>

      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        aria-label={
          collapsed ? "Expand sidebar" : "Collapse sidebar"
        }
        title={
          collapsed ? "Expand sidebar" : "Collapse sidebar"
        }
        className="absolute top-7 -right-3 z-50 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-sidebar-active text-sidebar-text shadow-sm transition-colors hover:bg-accent hover:text-white"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>
    </motion.aside>
  );
}