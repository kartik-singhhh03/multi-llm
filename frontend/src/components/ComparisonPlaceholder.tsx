const PLACEHOLDER_MODELS = [
  {
    name: "OpenAI",
    description: "Future OpenAI response panel",
  },
  {
    name: "Claude",
    description: "Future Claude response panel",
  },
  {
    name: "Gemini",
    description: "Future Gemini response panel",
  },
] as const;

export function ComparisonPlaceholder() {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-sm font-medium text-zinc-300">
          Model comparison
        </h2>
        <p className="text-xs text-zinc-500">Visual placeholders only</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PLACEHOLDER_MODELS.map((model) => (
          <article
            key={model.name}
            className="flex min-h-56 flex-col rounded-xl border border-zinc-800 bg-zinc-900/60 p-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-medium text-zinc-100">{model.name}</h3>
              <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
                Coming later
              </span>
            </div>
            <p className="flex-1 text-sm leading-6 text-zinc-500">
              {model.description}. Side-by-side answers and “Continue with this
              model” will be added in a later phase.
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
