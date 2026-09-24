import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { admin as adminPlugin } from "better-auth/plugins";

import { db } from "@/db";
import { ac, admin, staff } from "@/lib/auth/permissions";

export const auth = betterAuth({
  baseURL: {
    allowedHosts: [
      "localhost:3001",
      "*.vercel.app",
    ],
    protocol:
      process.env.NODE_ENV === "development" ? "http" : "https",
  },

  trustedOrigins: [
    "http://localhost:3001",
    "https://warehouse-system-1qxqkk06y-warehouse-system2.vercel.app",
  ],

  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  emailAndPassword: {
    enabled: true,
  },

  user: {
    additionalFields: {
      mustChangePassword: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => {
          if (ctx?.path === "/sign-up/email") {
            throw new APIError("FORBIDDEN", {
              message: "Public registration is disabled.",
            });
          }

          return {
            data: user,
          };
        },
      },
    },
  },

  plugins: [
    adminPlugin({
      ac,
      roles: {
        admin,
        staff,
      },
      defaultRole: "staff",
    }),
  ],
});