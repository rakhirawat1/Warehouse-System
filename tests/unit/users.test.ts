import test from "node:test";
import assert from "node:assert/strict";

import {
  createUserSchema,
  updateUserRoleSchema,
  changePasswordSchema,
} from "../../src/features/users/schemas";

test("valid staff user passes validation", () => {
  const result = createUserSchema.safeParse({
    name: "John Staff",
    email: "john@example.com",
    password: "password123",
    role: "staff",
  });

  assert.equal(result.success, true);
});

test("invalid email is rejected", () => {
  const result = createUserSchema.safeParse({
    name: "John Staff",
    email: "not-an-email",
    password: "password123",
    role: "staff",
  });

  assert.equal(result.success, false);
});

test("short password is rejected", () => {
  const result = createUserSchema.safeParse({
    name: "John Staff",
    email: "john@example.com",
    password: "123",
    role: "staff",
  });

  assert.equal(result.success, false);
});

test("invalid role is rejected", () => {
  const result = createUserSchema.safeParse({
    name: "John Staff",
    email: "john@example.com",
    password: "password123",
    role: "manager",
  });

  assert.equal(result.success, false);
});

test("password confirmation must match", () => {
  const result = changePasswordSchema.safeParse({
    currentPassword: "oldpassword",
    newPassword: "newpassword123",
    confirmPassword: "differentpassword",
  });

  assert.equal(result.success, false);
});

test("valid password change passes", () => {
  const result = changePasswordSchema.safeParse({
    currentPassword: "oldpassword",
    newPassword: "newpassword123",
    confirmPassword: "newpassword123",
  });

  assert.equal(result.success, true);
});

test("user role update accepts admin", () => {
  const result = updateUserRoleSchema.safeParse({
    userId: "user-123",
    role: "admin",
  });

  assert.equal(result.success, true);
});
