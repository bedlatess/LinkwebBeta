"use client";

/**
 * Links Client Component — Interactive link manager
 *
 * Features:
 *   - dnd-kit drag-and-drop sorting
 *   - Add / Edit / Delete links
 *   - Live phone preview of the public link page
 */

import { useEffect } from "react";
import { useDashboardStore, type LinkItem } from "@/stores/dashboard-store";
import { LinkEditor } from "./link-editor";
import { LinkList } from "./link-list";
import { PhonePreview } from "./phone-preview";
import { Plus, Sparkles } from "lucide-react";

interface Props {
  initialLinks: LinkItem[];
}

export function LinksClient({ initialLinks }: Props) {
  const { setLinks, isAddingLink, setIsAddingLink } = useDashboardStore();

  // Hydrate store with server-fetched data
  useEffect(() => {
    setLinks(initialLinks);
  }, [initialLinks, setLinks]);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/70">
              Link Assets
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
              链接编排
            </h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs text-white/42">
            <Sparkles className="h-3.5 w-3.5 text-emerald-200/70" />
            拖拽排序实时同步
          </div>
        </div>

        {!isAddingLink ? (
          <button
            onClick={() => setIsAddingLink(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-cyan-300/25 bg-cyan-300/[0.06] px-4 py-4 text-sm font-semibold text-cyan-100/75 transition hover:border-cyan-300/40 hover:bg-cyan-300/[0.1] hover:text-cyan-50"
          >
            <Plus className="h-4 w-4" />
            添加新链接
          </button>
        ) : (
          <LinkEditor
            mode="create"
            onClose={() => setIsAddingLink(false)}
          />
        )}

        <LinkList />
      </section>

      <aside className="xl:sticky xl:top-8 xl:self-start">
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/32">
            实时预览
          </span>
          <div className="h-px flex-1 bg-white/[0.06]" />
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <PhonePreview />
        </div>
      </aside>
    </div>
  );
}
