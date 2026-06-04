"use client";

import { Trash2 } from "lucide-react";

interface DeleteLinkButtonProps {
  title: string;
}

export function DeleteLinkButton({ title }: DeleteLinkButtonProps) {
  return (
    <button
      type="submit"
      onClick={(event) => {
        const ok = window.confirm(
          `确认删除/下架链接「${title}」吗？该操作会物理删除链接及其访问日志，无法恢复。`
        );

        if (!ok) {
          event.preventDefault();
        }
      }}
      className="inline-flex items-center gap-2 rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm text-red-200 transition hover:border-red-300/40 hover:bg-red-500/20 hover:text-red-100"
    >
      <Trash2 className="h-4 w-4" />
      删除/下架
    </button>
  );
}
