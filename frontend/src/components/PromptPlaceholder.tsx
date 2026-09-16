export function PromptPlaceholder() {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-5">
      <label
        htmlFor="prompt-placeholder"
        className="mb-3 block text-sm font-medium text-zinc-300"
      >
        Prompt
      </label>
      <textarea
        id="prompt-placeholder"
        disabled
        rows={4}
        placeholder="Ask a question... prompt input will be enabled in a later phase."
        className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-zinc-300 placeholder:text-zinc-600 disabled:cursor-not-allowed"
      />
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-zinc-500">
          Chat submission is not implemented in Phase 1.
        </p>
        <button
          type="button"
          disabled
          className="rounded-lg border border-zinc-800 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-400 disabled:cursor-not-allowed"
        >
          Compare models
        </button>
      </div>
    </section>
  );
}
