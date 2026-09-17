import type { FormEvent, KeyboardEvent } from "react";

import { MAX_PROMPT_LENGTH } from "../lib/constants";
import { btnPrimary, focusRing } from "../lib/ui";

type PromptInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  submitLabel: string;
  placeholder: string;
  inputId?: string;
  label?: string;
};

export function PromptInput({
  value,
  onChange,
  onSubmit,
  disabled,
  submitLabel,
  placeholder,
  inputId = "prompt-input",
  label = "Your question",
}: PromptInputProps) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (disabled || !value.trim()) {
      return;
    }
    onSubmit();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!disabled && value.trim()) {
        onSubmit();
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
    >
      <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-zinc-200">
        {label}
      </label>
      <textarea
        id={inputId}
        value={value}
        onChange={(event) => onChange(event.target.value.slice(0, MAX_PROMPT_LENGTH))}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={5}
        maxLength={MAX_PROMPT_LENGTH}
        placeholder={placeholder}
        className={`min-h-28 w-full resize-y rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm leading-6 text-zinc-100 placeholder:text-zinc-600 ${focusRing} disabled:cursor-not-allowed disabled:opacity-60`}
      />
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-zinc-500">
          Press Enter to send · Shift+Enter for a new line
          <span className="ml-2 text-zinc-600">
            {value.length}/{MAX_PROMPT_LENGTH}
          </span>
        </p>
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className={`${btnPrimary} w-full sm:w-auto`}
        >
          {disabled ? "Working..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
