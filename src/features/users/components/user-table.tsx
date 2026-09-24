"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";

import {
  getUserDetailsAction,
  removeUserAction,
  updateUserRoleAction,
} from "../actions";
import type { AppUser, UserRole } from "../types";

import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import DataTable, { type Column } from "@/components/ui/data-table";
import DropdownMenu from "@/components/ui/dropdown-menu";
import EmptyState from "@/components/ui/empty-state";
import FormMessage from "@/components/ui/form-message";
import { Input, Select } from "@/components/ui/input";
import Modal from "@/components/ui/modal";
import { useAction } from "@/lib/use-action";

type UserTableProps = {
  users: AppUser[];
  currentUserId: string;
};

type UserDetails = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  mustChangePassword: boolean | null;
  temporaryPassword: string | null;
};

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function UserTable({
  users,
  currentUserId,
}: UserTableProps) {
  const router = useRouter();

  const [tab, setTab] = useState("all");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] =
    useState<AppUser | null>(null);

  const [detailsUser, setDetailsUser] =
    useState<AppUser | null>(null);

  const [details, setDetails] =
    useState<UserDetails | null>(null);

  const [detailsLoading, setDetailsLoading] =
    useState(false);

  const [detailsError, setDetailsError] =
    useState<string | null>(null);

  const [showTemporaryPassword, setShowTemporaryPassword] =
    useState(false);

  const [copiedTemporaryPassword, setCopiedTemporaryPassword] =
    useState(false);

  const changeRole = useAction(updateUserRoleAction, {
    onSuccess: () => router.refresh(),
  });

  const remove = useAction(removeUserAction, {
    onSuccess: () => {
      setPendingRemove(null);
      router.refresh();
    },
  });

  const counts = useMemo(
    () => ({
      all: users.length,
      admin: users.filter((user) => user.role === "admin").length,
      staff: users.filter((user) => user.role === "staff").length,
    }),
    [users],
  );

  const rows = useMemo(
    () =>
      tab === "all"
        ? users
        : users.filter((user) => user.role === tab),
    [users, tab],
  );

  async function openDetails(user: AppUser) {
    setDetailsUser(user);
    setDetails(null);
    setDetailsError(null);
    setShowTemporaryPassword(false);
    setCopiedTemporaryPassword(false);
    setDetailsLoading(true);

    const result = await getUserDetailsAction(user.id);

    if (result.ok) {
      setDetails(result.data);
    } else {
      setDetailsError(
        result.error ?? "Unable to load user details.",
      );
    }

    setDetailsLoading(false);
  }

  function closeDetails() {
    if (detailsLoading) {
      return;
    }

    setDetailsUser(null);
    setDetails(null);
    setDetailsError(null);
    setShowTemporaryPassword(false);
    setCopiedTemporaryPassword(false);
  }

  async function copyTemporaryPassword() {
    if (!details?.temporaryPassword) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        details.temporaryPassword,
      );

      setCopiedTemporaryPassword(true);

      window.setTimeout(() => {
        setCopiedTemporaryPassword(false);
      }, 2000);
    } catch {
      setCopiedTemporaryPassword(false);
    }
  }

  const columns: Column<AppUser>[] = [
    {
      key: "name",
      header: "Name",
      sortValue: (user) => user.name,
      cell: (user) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-muted text-xs font-semibold text-accent">
            {initials(user.name)}
          </span>

          <span className="min-w-0">
            <span className="block font-medium text-primary">
              {user.name}

              {user.id === currentUserId && (
                <span className="ml-2 text-xs font-normal text-muted">
                  (you)
                </span>
              )}
            </span>

            <span className="block truncate text-xs text-muted">
              {user.email}
            </span>
          </span>
        </div>
      ),
    },

    {
      key: "role",
      header: "Role",
      sortValue: (user) => user.role,
      cell: (user) => (
        <Badge
          variant={
            user.role === "admin" ? "accent" : "neutral"
          }
        >
          {user.role === "admin"
            ? "Administrator"
            : "Staff"}
        </Badge>
      ),
    },

    {
      key: "changeRole",
      header: "Change role",
      hideBelow: "md",
      cell: (user) => (
        <Select
          aria-label={`Role for ${user.name}`}
          className="h-9 w-36"
          value={user.role}
          disabled={
            user.id === currentUserId ||
            (changeRole.pending && pendingId === user.id)
          }
          onChange={async (event) => {
            setPendingId(user.id);

            await changeRole.run({
              userId: user.id,
              role: event.target.value as UserRole,
            });

            setPendingId(null);
          }}
        >
          <option value="staff">Staff</option>
          <option value="admin">Administrator</option>
        </Select>
      ),
    },

    {
      key: "created",
      header: "Created",
      hideBelow: "lg",
      sortValue: (user) =>
        new Date(user.createdAt).getTime(),
      cell: (user) => formatDate(user.createdAt),
    },

    {
      key: "actions",
      header: "Actions",
      align: "right",
      cell: (user) => (
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              {
                label: "View details",
                icon: <Users className="h-4 w-4" />,
                onSelect: () => {
                  openDetails(user);
                },
              },
              {
                label: "Remove account",
                icon: <Trash2 className="h-4 w-4" />,
                destructive: true,
                disabled: user.id === currentUserId,
                onSelect: () => {
                  remove.reset();
                  setPendingRemove(user);
                },
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      {(changeRole.message || changeRole.error) && (
        <div className="mb-4">
          <FormMessage
            success={changeRole.message}
            error={changeRole.error}
          />
        </div>
      )}

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(user) => user.id}
        searchText={(user) =>
          `${user.name} ${user.email}`
        }
        searchPlaceholder="Search people..."
        noun="accounts"
        initialSort={{
          key: "name",
          direction: "asc",
        }}
        tabs={[
          {
            value: "all",
            label: "All",
            count: counts.all,
          },
          {
            value: "admin",
            label: "Administrators",
            count: counts.admin,
          },
          {
            value: "staff",
            label: "Staff",
            count: counts.staff,
          },
        ]}
        tabValue={tab}
        onTabChange={setTab}
        empty={
          <EmptyState
            icon={Users}
            title="No accounts yet"
            description="Every account is created here; there is no public sign-up."
          />
        }
      />

      <Modal
        open={Boolean(detailsUser)}
        onClose={closeDetails}
        title="User details"
        description="View account information and temporary access details."
        busy={detailsLoading}
        footer={
          <div className="flex justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={closeDetails}
              disabled={detailsLoading}
            >
              Close
            </Button>
          </div>
        }
      >
        {detailsLoading && (
          <div className="py-8 text-center text-sm text-muted">
            Loading user details...
          </div>
        )}

        {detailsError && (
          <FormMessage error={detailsError} />
        )}

        {details && (
          <div className="space-y-5">
            <div className="rounded-xl border border-border bg-surface-subtle p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-muted text-sm font-semibold text-accent">
                  {initials(details.name)}
                </span>

                <div className="min-w-0">
                  <p className="font-semibold text-primary">
                    {details.name}
                  </p>

                  <p className="truncate text-sm text-muted">
                    {details.email}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <Badge
                  variant={
                    details.role === "admin"
                      ? "accent"
                      : "neutral"
                  }
                >
                  {details.role === "admin"
                    ? "Administrator"
                    : "Staff"}
                </Badge>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-primary">
                Temporary password
              </p>

              {details.mustChangePassword &&
              details.temporaryPassword ? (
                <>
                  <div className="mt-2 flex gap-2">
                    <Input
                      value={
                        showTemporaryPassword
                          ? details.temporaryPassword
                          : "••••••••••••••••"
                      }
                      readOnly
                      className="min-w-0 flex-1 font-mono"
                    />

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        setShowTemporaryPassword(
                          (value) => !value,
                        )
                      }
                      icon={
                        showTemporaryPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )
                      }
                    >
                      {showTemporaryPassword
                        ? "Hide"
                        : "Show"}
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={copyTemporaryPassword}
                      icon={
                        copiedTemporaryPassword ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )
                      }
                    >
                      {copiedTemporaryPassword
                        ? "Copied"
                        : "Copy"}
                    </Button>
                  </div>

                  <p className="mt-2 text-xs text-muted">
                    This password is temporary and will be
                    cleared after the user sets their own
                    password.
                  </p>
                </>
              ) : (
                <div className="mt-2 rounded-lg border border-border bg-surface-subtle p-3">
                  <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
                    <Check className="h-4 w-4 text-success" />
                    Password configured
                  </p>

                  <p className="mt-1 text-xs text-muted">
                    The temporary password is no longer
                    available because the user has set
                    their own password.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingRemove)}
        onClose={() => setPendingRemove(null)}
        onConfirm={() =>
          pendingRemove &&
          remove.run(pendingRemove.id)
        }
        title="Remove account"
        confirmLabel="Remove account"
        pendingLabel="Removing..."
        destructive
        pending={remove.pending}
        error={remove.error}
      >
        {pendingRemove && (
          <div className="rounded-lg border border-border bg-surface-subtle p-4">
            <p className="font-medium text-primary">
              {pendingRemove.name}
            </p>

            <p className="mt-1 text-sm text-muted">
              {pendingRemove.email}
            </p>

            <p className="mt-3 flex items-start gap-2 text-sm text-secondary">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted" />

              <span>
                They will no longer be able to sign in.
                The stock movements they recorded keep
                their name, so the history stays complete.
              </span>
            </p>

            <p className="mt-2 flex items-start gap-2 text-sm text-secondary">
              <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-muted" />

              <span>
                To keep the account but stop the access,
                change the password instead.
              </span>
            </p>
          </div>
        )}
      </ConfirmDialog>
    </>
  );
}