type LoadingStateProps = {
  message?: string;
};

export function LoadingState({
  message = "Querying OpenAI, Claude, and Gemini...",
}: LoadingStateProps) {
  return (
    <p className="text-xs text-zinc-500" role="status">
      {message}
    </p>
  );
}
