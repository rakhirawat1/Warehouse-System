"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { runAction } from "@/lib/action";
import { authorize } from "@/lib/auth/guards";
import { DomainError } from "@/lib/errors";

import {
  changePasswordSchema,
  createUserSchema,
  updateUserRoleSchema,
} from "./schemas";

import { getUserDetails } from "./queries";

import {
  changeOwnPassword,
  createUser,
  removeUser,
  updateUserRole,
} from "./service";

const userId = z.string().min(1, "Invalid user.");

export async function createUserAction(input: unknown) {
  return runAction(
    async () => {
      await authorize("users:manage");

      const data = createUserSchema.parse(input);

      await createUser({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      });

      revalidatePath("/users");

      return {
        name: data.name,
        role: data.role,
      };
    },
    (user) =>
      `${user.name} was added as ${
        user.role === "admin" ? "an administrator" : "staff"
      }.`,
  );
}

export async function updateUserRoleAction(input: unknown) {
  return runAction(
    async () => {
      const actor = await authorize("users:manage");

      const data = updateUserRoleSchema.parse(input);

      if (data.userId === actor.id && data.role !== "admin") {
        throw new DomainError(
          "You cannot remove your own administrator role. Ask another administrator to do it.",
          "CONFLICT",
        );
      }

      await updateUserRole(data.userId, data.role);

      revalidatePath("/users");

      return { role: data.role };
    },
    (result) =>
      `Role changed to ${
        result.role === "admin" ? "administrator" : "staff"
      }.`,
  );
}

export async function removeUserAction(id: string) {
  return runAction(
    async () => {
      const actor = await authorize("users:manage");

      const parsedId = userId.parse(id);

      if (parsedId === actor.id) {
        throw new DomainError(
          "You cannot delete your own account.",
          "CONFLICT",
        );
      }

      await removeUser(parsedId);

      revalidatePath("/users");
    },
    "The user was removed. Their past stock movements are kept.",
  );
}

export async function getUserDetailsAction(id: string) {
  return runAction(
    async () => {
      await authorize("users:manage");

      const parsedId = userId.parse(id);

      const details = await getUserDetails(parsedId);

      if (!details) {
        throw new DomainError(
          "User not found.",
          "NOT_FOUND",
        );
      }

      return {
        id: details.id,
        name: details.name,
        email: details.email,
        role: details.role,
        emailVerified: details.emailVerified,
        createdAt: details.createdAt,
        updatedAt: details.updatedAt,
        mustChangePassword: details.mustChangePassword,
        temporaryPassword: details.mustChangePassword
          ? details.temporaryPassword
          : null,
      };
    },
    () => "User details loaded.",
  );
}

export async function changePasswordAction(input: unknown) {
  return runAction(
    async () => {
      const actor = await authorize();

      const data = changePasswordSchema.parse(input);

      await changeOwnPassword(
        actor.id,
        data.currentPassword,
        data.newPassword,
      );
    },
    "Your password was changed.",
  );
}