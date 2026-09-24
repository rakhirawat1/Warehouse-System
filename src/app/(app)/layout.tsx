import { requireAuth } from "@/lib/auth/guards";

import {
  getDashboardStats,
  getLowSpaceAlerts,
} from "@/features/dashboard/queries";

import AppSidebar from "@/components/layout/app-sidebar";
import AppHeader, { type HeaderAlert } from "@/components/layout/app-header";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await requireAuth();

  const [lowSpace, stats] = await Promise.all([
    getLowSpaceAlerts(),
    getDashboardStats(),
  ]);

  const alerts: HeaderAlert[] = [
    ...lowSpace.slice(0, 5).map((space) => ({
      id: space.id,
      title: `${space.name} is ${space.usedPercent}% full`,
      detail: `${space.warehouseName} · ${space.available} units free`,
      href: `/warehouses/${space.warehouseId}/storage-spaces/${space.id}`,
    })),
  ];

  if (stats.partlyAllocatedItems > 0) {
    alerts.push({
      id: "unallocated",
      title: `${stats.unallocatedUnits} units are not allocated`,
      detail: `${stats.partlyAllocatedItems} item${
        stats.partlyAllocatedItems === 1 ? "" : "s"
      } still need a storage space`,
      href: "/items?filter=unallocated",
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar
        role={actor.role}
        name={actor.name}
        email={actor.email}
      />

      <div
        className="flex min-h-screen min-w-0 flex-col transition-[margin-left] duration-200 ease-in-out"
        style={{
          marginLeft: "var(--sidebar-width, 256px)",
        }}
      >
        <AppHeader
          name={actor.name}
          email={actor.email}
          role={actor.role}
          alerts={alerts}
        />

        <main className="min-w-0 flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}