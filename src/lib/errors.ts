/**
 * A business-rule error that is safe to show. Next.js hides thrown messages in
 * production, so actions turn this into a typed result (see lib/action.ts).
 */
export class DomainError extends Error {
  constructor(
    message: string,
    readonly code:
      | "NOT_FOUND"
      | "CONFLICT"
      | "CAPACITY"
      | "INVALID"
      | "FORBIDDEN" = "INVALID",
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export class ForbiddenError extends DomainError {
  constructor(
    message = "You do not have permission to do this. Ask an administrator.",
  ) {
    super(message, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export function notFound(what: string) {
  return new DomainError(
    `${what} was not found. It may have been deleted.`,
    "NOT_FOUND",
  );
}

/**
 * True for a unique-constraint violation (PostgreSQL 23505). Drizzle may put
 * the code on the error or on its cause.
 */
export function isUniqueViolation(error: unknown, constraint?: string) {
  const candidates = [error, (error as { cause?: unknown })?.cause];

  return candidates.some((candidate) => {
    const pgError = candidate as { code?: string; constraint?: string };

    return (
      pgError?.code === "23505" &&
      (!constraint || pgError.constraint === constraint)
    );
  });
}
