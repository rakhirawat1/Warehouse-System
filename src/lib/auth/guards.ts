import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { ForbiddenError } from "@/lib/errors";

import { auth } from "@/lib/auth/auth";
import { can, toRole, type Permission, type Role } from "@/lib/auth/permissions";

export type Actor = {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Set for admin-created accounts until the temporary password is changed. */
  mustChangePassword: boolean;
};

/** Reads the session once per request and normalises the role. */
export const getActor = cache(async (): Promise<Actor | null> => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name || session.user.email,
    email: session.user.email,
    role: toRole(session.user.role),
    mustChangePassword: session.user.mustChangePassword === true,
  };
});

/** For pages: sends signed-out visitors to the login page. */
export async function requireAuth() {
  const actor = await getActor();

  if (!actor) {
    redirect("/login");
  }

  // A temporary password must be replaced before anything else is allowed.
  if (actor.mustChangePassword) {
    redirect("/change-password");
  }

  return actor;
}

/** For pages: sends users without the permission back to the dashboard. */
export async function requirePagePermission(permission: Permission) {
  const actor = await requireAuth();

  if (!can(actor.role, permission)) {
    redirect("/dashboard?denied=1");
  }

  return actor;
}

export async function requireAdmin() {
  const actor = await requireAuth();

  if (actor.role !== "admin") {
    redirect("/dashboard?denied=1");
  }

  return actor;
}

/** For pages: keeps the old call style working. */
export async function requireRole(allowedRoles: Role[]) {
  const actor = await requireAuth();

  if (!allowedRoles.includes(actor.role)) {
    redirect("/dashboard?denied=1");
  }

  return actor;
}

/**
 * For server actions: throws an error that runAction turns into a result.
 * Without a permission it only needs a signed-in user, which lets the
 * change-password action run while a temporary password is pending.
 */
export async function authorize(permission?: Permission) {
  const actor = await getActor();

  if (!actor) {
    throw new ForbiddenError(
      "Your session has expired. Please sign in again.",
    );
  }

  if (permission && actor.mustChangePassword) {
    throw new ForbiddenError(
      "Change your temporary password before doing anything else.",
    );
  }

  if (permission && !can(actor.role, permission)) {
    throw new ForbiddenError(
      "Your role does not allow this action. Ask an administrator for help.",
    );
  }

  return actor;
}
