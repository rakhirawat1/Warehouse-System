"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";

import { changePasswordAction } from "../actions";
import Button from "@/components/ui/button";
import FormMessage from "@/components/ui/form-message";
import { Input, Label } from "@/components/ui/input";
import { useAction } from "@/lib/use-action";

type ChangePasswordFormProps = {
  redirectTo?: string;

  currentPasswordLabel?: string;
};

export default function ChangePasswordForm({
  redirectTo,
  currentPasswordLabel = "Current password",
}: ChangePasswordFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const change = useAction(changePasswordAction, {
    onSuccess: () => {
      formRef.current?.reset();

      if (redirectTo) {
        router.replace(redirectTo);
        router.refresh();
      }
    },
  });

  async function handleSubmit(formData: FormData) {
    await change.run({
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword"),
    });
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="mt-6 max-w-xl space-y-5"
    >
      <div>
        <Label htmlFor="currentPassword">
          {currentPasswordLabel}
        </Label>

        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          disabled={change.pending}
        />

        {change.fieldError("currentPassword") && (
          <p className="mt-1 text-sm text-danger">
            {change.fieldError("currentPassword")}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="newPassword">New password</Label>

        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          disabled={change.pending}
        />

        <p className="mt-1 text-sm text-muted">
          At least 8 characters.
        </p>

        {change.fieldError("newPassword") && (
          <p className="mt-1 text-sm text-danger">
            {change.fieldError("newPassword")}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="confirmPassword">
          Repeat new password
        </Label>

        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          disabled={change.pending}
        />

        {change.fieldError("confirmPassword") && (
          <p className="mt-1 text-sm text-danger">
            {change.fieldError("confirmPassword")}
          </p>
        )}
      </div>

      <FormMessage
        error={change.error}
        success={change.message}
      />

      <Button
        type="submit"
        disabled={change.pending}
        icon={<KeyRound className="h-4 w-4" />}
      >
        {change.pending
          ? "Changing..."
          : "Change password"}
      </Button>
    </form>
  );
}