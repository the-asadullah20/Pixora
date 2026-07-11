"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Database, Globe, Loader2, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { deleteHistoryItem, listHistory } from "@/lib/api";
import type { HistoryItem } from "@/lib/types";
import { SourceChip } from "@/components/chat/SourceChip";
import { RabbitMascot } from "@/components/mascot/RabbitMascot";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

function formatDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function HistoryList() {
  const { getToken } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async (before?: string) => {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await listHistory(token, { limit: 20, before });
      setItems((prev) => (before ? [...prev, ...res.items] : res.items));
      setNextCursor(res.next_cursor);
    } catch {
      setError("Couldn't load your history. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id: string) => {
    const token = await getToken();
    if (!token) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await deleteHistoryItem(token, id);
    } catch {
      load(); // revert on failure by reloading
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24">
        <RabbitMascot className="h-10 w-10 animate-rabbit-hop" />
        <p className="text-sm text-ink-500">Loading your history…</p>
      </div>
    );
  }

  if (error) {
    return <p className="py-16 text-center text-sm text-rose-600">{error}</p>;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24 text-center">
        <RabbitMascot className="h-12 w-12" />
        <h2 className="font-display text-xl font-semibold text-ink-900">No searches yet</h2>
        <p className="max-w-sm text-sm text-ink-500">
          Every search you run gets saved here so you can find it again later.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="mb-6 font-display text-2xl font-semibold text-ink-900">Search history</h1>

      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const expanded = expandedId === item.id;
          return (
            <div
              key={item.id}
              className="rounded-3xl border border-sky-100 bg-white p-4 shadow-card transition-shadow hover:shadow-soft"
            >
              <button
                className="flex w-full items-start gap-3 text-left"
                onClick={() => setExpandedId(expanded ? null : item.id)}
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                  {item.mode === "internet" ? (
                    <Globe className="h-4 w-4" />
                  ) : (
                    <Database className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-ink-900">
                      {item.image_description || "Untitled search"}
                    </p>
                    <span className="shrink-0 text-xs text-ink-500">{formatDate(item.created_at)}</span>
                  </div>
                  {!expanded && (
                    <p className="mt-1 line-clamp-1 text-xs text-ink-500">{item.answer}</p>
                  )}
                </div>
                <ChevronDown
                  className={cn("mt-1 h-4 w-4 shrink-0 text-ink-500 transition-transform", expanded && "rotate-180")}
                />
              </button>

              {expanded && (
                <div className="mt-3 border-t border-sky-100 pt-3">
                  {item.sources.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {item.sources.map((s, i) => (
                        <SourceChip key={i} source={s} />
                      ))}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-900">
                    {item.answer}
                  </p>
                  <div className="mt-3 flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {nextCursor && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="secondary"
            loading={loadingMore}
            onClick={() => {
              setLoadingMore(true);
              load(nextCursor);
            }}
          >
            <Loader2 className={cn("h-4 w-4", !loadingMore && "hidden")} />
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
