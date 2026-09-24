import { z } from "zod";

import { DomainError } from "./errors";

export type FieldErrors = Record<string, string[] | undefined>;

export type ActionResult<T = void> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

/**
 * Runs action logic and returns a typed result. Unexpected errors are logged
 * and replaced with a generic message so internals never reach the browser.
 */
export async function runAction<T>(
  fn: () => Promise<T>,
  successMessage?: string | ((data: T) => string),
): Promise<ActionResult<T>> {
  try {
    const data = await fn();

    return {
      ok: true,
      data,
      message:
        typeof successMessage === "function"
          ? successMessage(data)
          : successMessage,
    };
  } catch (error) {
    return toFailure(error);
  }
}

export function toFailure(error: unknown): {
  ok: false;
  error: string;
  fieldErrors?: FieldErrors;
} {
  if (error instanceof DomainError) {
    return { ok: false, error: error.message };
  }

  if (error instanceof z.ZodError) {
    const flat = z.flattenError(error);

    const first =
      flat.formErrors[0] ??
      Object.values(flat.fieldErrors).flat().filter(Boolean)[0] ??
      "Some fields are not valid.";

    return {
      ok: false,
      error: `Please check the form. ${first}`,
      fieldErrors: flat.fieldErrors as FieldErrors,
    };
  }

  const fromDatabase = databaseMessage(error);

  if (fromDatabase) {
    return { ok: false, error: fromDatabase };
  }

  console.error("[action] unexpected error", error);

  return {
    ok: false,
    error: "Something went wrong on our side. Please try again.",
  };
}

/** Turns Postgres constraint and trigger errors into plain language. */
function databaseMessage(error: unknown) {
  const cause = (error as { cause?: unknown })?.cause ?? error;
  const pg = cause as { code?: string; constraint?: string; message?: string };

  if (pg?.code === "23505") {
    if (pg.constraint === "allocations_item_space_unique") {
      return "This item is already stored in that storage space. Edit the existing allocation instead.";
    }

    return "This record already exists.";
  }

  if (pg?.code === "23514") {
    // Raised by a CHECK constraint or by our capacity trigger.
    return `The database blocked this change: ${pg.message ?? "a rule was broken"}.`;
  }

  if (pg?.code === "23503") {
    return "This record is still used by other records, so it cannot be removed.";
  }

  if (pg?.code === "40P01") {
    return "Another user changed the same stock at the same time. Please try again.";
  }

  return null;
}
