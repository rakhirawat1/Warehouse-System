import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth/auth";
import { toRole } from "@/lib/auth/permissions";

/** Lists accounts. Temporary passwords are deliberately left out. */
export async function getUsers() {
  const result = await auth.api.listUsers({
    query: {
      limit: 100,
      sortBy: "name",
      sortDirection: "asc",
    },
    headers: await headers(),
  });

  return result.users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: toRole(user.role),
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));
}

/** One user, including the temporary password. Kept apart from getUsers on purpose. */
export async function getUserDetails(userId: string) {
  const result = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      mustChangePassword: user.mustChangePassword,
      temporaryPassword: user.temporaryPassword,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return result[0] ?? null;
}