import { redirect } from "next/navigation";
import { KeyRound, Package } from "lucide-react";

import { getActor } from "@/lib/auth/guards";
import ChangePasswordForm from "@/features/users/components/change-password-form";

/** The only screen reachable until a temporary password is changed (see lib/auth/guards.ts). */
export default async function ChangePasswordPage() {
  const actor = await getActor();

  if (!actor) {
    redirect("/login");
  }

  if (!actor.mustChangePassword) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-raised">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
            <Package className="h-5 w-5 text-white" />
          </div>

          <div>
            <p className="text-xl leading-none font-bold text-primary">WMS</p>

            <p className="mt-1 text-[11px] text-muted">
              Warehouse Management System
            </p>
          </div>
        </div>

        <div className="mt-7 flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-accent" />

          <h1 className="text-2xl font-bold tracking-tight text-primary">
            Set your password
          </h1>
        </div>

        <p className="mt-2 text-sm text-muted">
          Welcome, {actor.name}. Your account was created with a temporary
          password. Choose your own password to continue.
        </p>

        <ChangePasswordForm
          redirectTo="/dashboard"
          currentPasswordLabel="Temporary password"
        />
      </div>
    </main>
  );
}
