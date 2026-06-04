"use client";

import { Trash2 } from "lucide-react";

interface CleanupActionButtonProps {
  label: string;
  confirmText: string;
  disabled?: boolean;
}

export function CleanupActionButton({
  label,
  confirmText,
  disabled = false,
}: CleanupActionButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled}
      onClick={(event) => {
        const ok = window.confirm(confirmText);

        if (!ok) {
          event.preventDefault();
        }
      }}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-100 transition hover:border-red-300/40 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-45"
    >
      <Trash2 className="h-4 w-4" />
      {label}
    </button>
  );
}
