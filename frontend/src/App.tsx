import { AppHeader } from "./components/AppHeader";
import { ComparisonPlaceholder } from "./components/ComparisonPlaceholder";
import { PromptPlaceholder } from "./components/PromptPlaceholder";
import { useBackendHealth } from "./hooks/useBackendHealth";

function App() {
  const backendStatus = useBackendHealth();

  return (
    <div className="min-h-svh bg-zinc-950 text-zinc-200">
      <AppHeader backendStatus={backendStatus} />
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <PromptPlaceholder />
        <ComparisonPlaceholder />
      </main>
    </div>
  );
}

export default App;
