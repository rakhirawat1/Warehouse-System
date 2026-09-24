"use client";

import { useState, useTransition } from "react";

import type { ActionResult, FieldErrors } from "@/lib/action";

/** Calls a server action and keeps its { ok, error } result in state. */
export function useAction<Args extends unknown[], T>(
  action: (...args: Args) => Promise<ActionResult<T>>,
  options: {
    /** Also receives the action's success message, if it set one. */
    onSuccess?: (data: T, message: string | null) => void;
    resetMessageOnRun?: boolean;
  } = {},
) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [data, setData] = useState<T | null>(null);

  function run(...args: Args) {
    setError(null);
    setFieldErrors({});

    if (options.resetMessageOnRun !== false) {
      setMessage(null);
    }

    return new Promise<ActionResult<T>>((resolve) => {
      startTransition(async () => {
        const result = await action(...args);

        if (result.ok) {
          setData(result.data);
          setMessage(result.message ?? null);
          options.onSuccess?.(result.data, result.message ?? null);
        } else {
          setError(result.error);
          setFieldErrors(result.fieldErrors ?? {});
        }

        resolve(result);
      });
    });
  }

  return {
    run,
    pending,
    error,
    message,
    data,
    fieldError: (name: string) => fieldErrors[name]?.[0],
    reset: () => {
      setError(null);
      setMessage(null);
      setFieldErrors({});
      setData(null);
    },
  };
}
