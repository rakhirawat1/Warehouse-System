import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";

const statement = {
  ...defaultStatements,

  warehouse: ["create", "read", "update", "delete"],
  storageSpace: ["create", "read", "update", "delete"],
  item: ["create", "read", "update", "delete"],
  allocation: ["create", "read", "update", "delete"],
} as const;

export const ac = createAccessControl(statement);

export const admin = ac.newRole({
  ...adminAc.statements,

  warehouse: ["create", "read", "update", "delete"],
  storageSpace: ["create", "read", "update", "delete"],
  item: ["create", "read", "update", "delete"],
  allocation: ["create", "read", "update", "delete"],
});

export const staff = ac.newRole({
  warehouse: ["create", "read", "update"],
  storageSpace: ["create", "read", "update"],
  item: ["create", "read", "update"],
  allocation: ["create", "read", "update"],
});

// One matrix for the server guards and the UI. The UI check only hides buttons;
// the server check is what protects the data.

export const ROLES = ["admin", "staff"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = {
  "warehouse:create": ["admin", "staff"],
  "warehouse:update": ["admin", "staff"],
  "warehouse:delete": ["admin"],

  "storageSpace:create": ["admin", "staff"],
  "storageSpace:update": ["admin", "staff"],
  "storageSpace:delete": ["admin"],

  "item:create": ["admin", "staff"],
  "item:update": ["admin", "staff"],
  "item:delete": ["admin"],

  "stock:receive": ["admin", "staff"],
  "stock:transfer": ["admin", "staff"],
  "stock:adjust": ["admin", "staff"],
  "stock:dispatch": ["admin", "staff"],

  "users:manage": ["admin"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

/** Normalises whatever is stored on the user row into a known role. */
export function toRole(value: unknown): Role {
  return value === "admin" ? "admin" : "staff";
}

export function can(role: Role | null | undefined, permission: Permission) {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

export const PERMISSION_GROUPS: {
  label: string;
  permissions: [Permission, string][];
}[] = [
  {
    label: "Warehouses",
    permissions: [
      ["warehouse:create", "Create warehouses"],
      ["warehouse:update", "Edit warehouses and change status"],
      ["warehouse:delete", "Delete empty warehouses"],
    ],
  },
  {
    label: "Storage spaces",
    permissions: [
      ["storageSpace:create", "Add storage spaces"],
      ["storageSpace:update", "Edit storage spaces"],
      ["storageSpace:delete", "Delete empty storage spaces"],
    ],
  },
  {
    label: "Items",
    permissions: [
      ["item:create", "Create items"],
      ["item:update", "Edit items"],
      ["item:delete", "Delete items without stock"],
    ],
  },
  {
    label: "Stock",
    permissions: [
      ["stock:receive", "Receive stock into storage"],
      ["stock:transfer", "Move stock between spaces"],
      ["stock:adjust", "Correct stored quantities"],
      ["stock:dispatch", "Dispatch stock out of inventory"],
    ],
  },
  {
    label: "Administration",
    permissions: [["users:manage", "Manage users and roles"]],
  },
];
