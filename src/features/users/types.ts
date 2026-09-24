import type { Role } from "@/lib/auth/permissions";

export type UserRole = Role;

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};
