import { Check, ShieldCheck, UserCog, Users, X } from "lucide-react";

import { requireAdmin } from "@/lib/auth/guards";
import { PERMISSION_GROUPS, ROLES, can } from "@/lib/auth/permissions";

import { getUsers } from "@/features/users/queries";
import UserTable from "@/features/users/components/user-table";
import UserForm from "@/features/users/components/user-form";

import PageHeader from "@/components/ui/page-header";
import StatCard from "@/components/ui/stat-card";
import PageTransition from "@/components/motion/page-transition";
import { Stagger } from "@/components/motion/stagger";

export default async function UsersPage() {
  const actor = await requireAdmin();

  const users = await getUsers();

  const admins = users.filter((user) => user.role === "admin").length;

  return (
    <PageTransition>
      <PageHeader
        action={<UserForm />}
      />

      <Stagger className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Accounts" value={users.length} icon={<Users className="h-5 w-5" />} />

        <StatCard
          label="Administrators"
          value={admins}
          icon={<ShieldCheck className="h-5 w-5" />}
          tone="info"
          hint="full access"
        />

        <StatCard
          label="Staff"
          value={users.length - admins}
          icon={<UserCog className="h-5 w-5" />}
          tone="success"
          hint="day-to-day stock work"
        />
      </Stagger>

      <UserTable users={users} currentUserId={actor.id} />

      <section className="mt-8 overflow-hidden rounded-xl border border-border bg-surface shadow-card">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-semibold text-primary">What each role can do</h3>

          <p className="mt-1 text-sm text-muted">
            These rules are checked on the server for every action, not only in
            the interface.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-subtle">
                <th className="px-5 py-3 text-xs font-semibold tracking-wide text-secondary uppercase">
                  Permission
                </th>

                {ROLES.map((role) => (
                  <th
                    key={role}
                    className="w-40 px-5 py-3 text-center text-xs font-semibold tracking-wide text-secondary uppercase"
                  >
                    {role === "admin" ? "Administrator" : "Staff"}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {PERMISSION_GROUPS.map((group) => (
                <tr key={group.label}>
                  <td colSpan={ROLES.length + 1} className="px-0 pt-5 pb-0">
                    <p className="px-5 pb-2 text-xs font-semibold tracking-wide text-muted uppercase">
                      {group.label}
                    </p>

                    <table className="w-full">
                      <tbody>
                        {group.permissions.map(([permission, label]) => (
                          <tr
                            key={permission}
                            className="border-b border-border last:border-0"
                          >
                            <td className="px-5 py-2.5 text-secondary">
                              {label}
                            </td>

                            {ROLES.map((role) => (
                              <td key={role} className="w-40 px-5 py-2.5">
                                <span className="flex justify-center">
                                  {can(role, permission) ? (
                                    <Check className="h-4 w-4 text-success" />
                                  ) : (
                                    <X className="h-4 w-4 text-muted" />
                                  )}
                                </span>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PageTransition>
  );
}
