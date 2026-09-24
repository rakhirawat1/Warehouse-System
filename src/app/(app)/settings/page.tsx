import { requireRole } from "@/lib/auth/guards";
import ChangePasswordForm from "@/features/users/components/change-password-form";

export default async function SettingsPage() {
  await requireRole(["admin", "staff"]);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl text-primary">
          Settings
        </h1>

        <p className="mt-1 text-sm text-muted">
          Manage your account settings.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-card">
        <h2 className="text-xl text-primary">
          Change Password
        </h2>

        <p className="mt-1 text-sm text-muted">
          Update your password for your account.
        </p>

        <ChangePasswordForm />
      </section>
    </div>
  );
}