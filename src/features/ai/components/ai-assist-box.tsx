"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

import Button from "@/components/ui/button";
import FormMessage from "@/components/ui/form-message";
import { Label, Textarea } from "@/components/ui/input";
import type { ActionResult } from "@/lib/action";

type AIAssistBoxProps<T> = {
  label: string;
  placeholder: string;
  /** Longest description accepted; defaults to 500 characters. */
  maxLength?: number;
  /** Calls the suggestion action. Nothing is saved by it. */
  suggest: (prompt: string) => Promise<ActionResult<T>>;
  /** Puts the suggestion into the form fields for the user to review. */
  onApply: (suggestion: T) => void;
};

/** Turns a plain description into form values. Nothing is saved until the form is submitted. */
export default function AIAssistBox<T>({
  label,
  placeholder,
  maxLength = 500,
  suggest,
  onApply,
}: AIAssistBoxProps<T>) {
  const [prompt, setPrompt] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  async function run() {
    setPending(true);
    setError(null);

    const result = await suggest(prompt);

    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onApply(result.data);
    setApplied(true);
  }

  return (
    <div className="rounded-xl border border-accent/30 bg-accent-muted/60 p-4">
      <Label htmlFor="ai-assist-prompt" className="flex items-center gap-1.5">
        <Sparkles className="h-4 w-4 text-accent" />
        {label}
      </Label>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <Textarea
          id="ai-assist-prompt"
          rows={2}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={placeholder}
          className="flex-1"
          maxLength={maxLength}
        />

        <Button
          type="button"
          variant="secondary"
          icon={<Sparkles className="h-4 w-4 text-accent" />}
          onClick={run}
          disabled={pending || prompt.trim().length < 3}
        >
          {pending ? "Thinking..." : "AI Assist"}
        </Button>
      </div>

      {applied && !error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-accent">
          <Sparkles className="h-3.5 w-3.5" />
          AI-generated suggestions — review before saving.
        </p>
      )}

      {error && (
        <div className="mt-2">
          <FormMessage error={error} />
        </div>
      )}
    </div>
  );
}
