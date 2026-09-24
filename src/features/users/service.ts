import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth/auth";
import { DomainError } from "@/lib/errors";

import type { UserRole } from "./types";

async function callAuth<T>(fn: () => Promise<T>) {
  try {
    return await fn();
  } catch (error) {
    const message = (
      error as { body?: { message?: string }; message?: string }
    )?.body?.message;

    throw new DomainError(message ?? "The request was rejected.");
  }
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}) {
  const created = await callAuth(async () =>
    auth.api.createUser({
      body: {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role as "admin",
      },
      headers: await headers(),
    }),
  );

  await db
    .update(user)
    .set({
      mustChangePassword: true,
      temporaryPassword: data.password,
      updatedAt: new Date(),
    })
    .where(eq(user.id, created.user.id));

  return created;
}

export async function updateUserRole(
  userId: string,
  role: UserRole,
) {
  return callAuth(async () =>
    auth.api.setRole({
      body: {
        userId,
        role: role as "admin",
      },
      headers: await headers(),
    }),
  );
}

export async function removeUser(userId: string) {
  return callAuth(async () =>
    auth.api.removeUser({
      body: { userId },
      headers: await headers(),
    }),
  );
}

export async function changeOwnPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  if (currentPassword === newPassword) {
    throw new DomainError(
      "The new password must be different from the current one.",
    );
  }

  const result = await callAuth(async () =>
    auth.api.changePassword({
      body: {
        currentPassword,
        newPassword,

        // Revoking would also end this session: the new cookie is not set from a server action.
        revokeOtherSessions: false,
      },
      headers: await headers(),
    }),
  );

  await db
    .update(user)
    .set({
      mustChangePassword: false,
      temporaryPassword: null,
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId));

  return result;
}