import { useEffect, useRef, useState } from "react";

import { btnSecondary } from "../lib/ui";

type CopyButtonProps = {
  text: string;
};

export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current != null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  async function handleCopy() {
    if (!text.trim()) {
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timeoutRef.current != null) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      disabled={!text.trim()}
      aria-label={copied ? "Copied" : "Copy response"}
      className={`${btnSecondary} px-2 py-1 text-xs font-normal`}
    >
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}
