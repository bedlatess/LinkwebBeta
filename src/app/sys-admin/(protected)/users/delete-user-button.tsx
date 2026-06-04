"use client";

import { Trash2 } from "lucide-react";

interface DeleteUserButtonProps {
  label: string;
}

export function DeleteUserButton({ label }: DeleteUserButtonProps) {
  return (
    <button
      type="submit"
      onClick={(event) => {
        const ok = window.confirm(
          `确认彻底删除用户「${label}」吗？此操作会级联删除账号、登录会话、主题配置、链接与访问记录，且不可恢复。`
        );

        if (!ok) {
          event.preventDefault();
        }
      }}
      className="inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-red-400/25 bg-red-500/10 px-3 text-sm leading-none text-red-200 transition hover:border-red-300/40 hover:bg-red-500/20 hover:text-red-100"
    >
      <Trash2 className="h-4 w-4" />
      删除
    </button>
  );
}
