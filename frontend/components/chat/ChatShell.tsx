"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ApiError, streamSearch } from "@/lib/api";
import type { ChatTurn, SearchMode, SourceItem } from "@/lib/types";
import { RabbitMascot } from "@/components/mascot/RabbitMascot";
import { ChatInput } from "./ChatInput";
import { SuggestedTopics, type SuggestedTopic } from "./SuggestedTopics";
import { TurnCard } from "./TurnCard";

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Playful, rotating labels shown in the assistant's status line (TurnCard)
// while a search is running — grouped by the underlying turn status so they
// still make sense in context.
const WORKING_LABELS: Record<string, string[]> = {
  analyzing: ["Looking closely…", "Untangling the pixels…", "Studying your image…"],
  retrieving: ["Digging through sources…", "Scraping up context…", "Cross-referencing…"],
  answering: ["Cooking up an answer…", "Putting it into words…", "Refurbishing the reply…"],
};

function useWorkingLabel(status: string | undefined, active: boolean) {
  const [label, setLabel] = useState<string>("Working on it…");

  useEffect(() => {
    if (!active || !status) return;
    const options = WORKING_LABELS[status] ?? ["Working on it…"];
    let i = 0;
    setLabel(options[0]);
    const interval = window.setInterval(() => {
      i = (i + 1) % options.length;
      setLabel(options[i]);
    }, 1800);
    return () => window.clearInterval(interval);
  }, [status, active]);

  return label;
}

export function ChatShell() {
  const { getToken } = useAuth();
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [mode, setMode] = useState<SearchMode>("picture");
  const [topK, setTopK] = useState(5);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  const updateTurn = (id: string, patch: Partial<ChatTurn>) => {
    setTurns((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const handleSubmit = async (file: File) => {
    const token = await getToken();
    if (!token) return;

    const id = newId();
    const turn: ChatTurn = {
      id,
      mode,
      imagePreviewUrl: URL.createObjectURL(file),
      description: null,
      sources: [],
      answer: "",
      status: "analyzing",
    };
    setTurns((prev) => [...prev, turn]);
    setStreamingId(id);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamSearch(
        { image: file, mode, topK, token },
        (event) => {
          switch (event.type) {
            case "description":
              updateTurn(id, { description: event.data as string, status: "retrieving" });
              break;
            case "sources":
              updateTurn(id, { sources: event.data as SourceItem[], status: "answering" });
              break;
            case "token":
              setTurns((prev) =>
                prev.map((t) => (t.id === id ? { ...t, answer: t.answer + (event.data as string) } : t))
              );
              break;
            case "done": {
              const data = event.data as { history_id?: string | null } | null;
              updateTurn(id, { status: "done", historyId: data?.history_id ?? null });
              break;
            }
            case "error": {
              const data = event.data as { detail?: string } | null;
              updateTurn(id, { status: "error", errorMessage: data?.detail ?? "Search failed." });
              break;
            }
          }
        },
        controller.signal
      );
    } catch (err) {
      if (!controller.signal.aborted) {
        const message = err instanceof ApiError ? err.message : "Network error — please try again.";
        updateTurn(id, { status: "error", errorMessage: message });
      }
    } finally {
      setStreamingId(null);
      abortRef.current = null;
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const handleTopicPick = (topic: SuggestedTopic) => {
    setHint(topic.hint);
    window.setTimeout(() => setHint(null), 3500);
  };

  const isEmpty = turns.length === 0;
  const activeTurn = turns.find((t) => t.id === streamingId);
  const workingLabel = useWorkingLabel(activeTurn?.status, !!streamingId);

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col">
      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-16">
          <div className="flex flex-col items-center text-center">
            <RabbitMascot className="h-16 w-16" />
            <h1 className="mt-4 font-display text-3xl font-semibold text-ink-900 sm:text-4xl">
              What are you looking at?
            </h1>
            <p className="mt-2 max-w-md text-sm text-ink-500">
              Upload an image and Pixora will search your knowledge base or the live web to tell
              you what it is.
            </p>
          </div>

          <ChatInput
            mode={mode}
            onModeChange={setMode}
            onSubmit={handleSubmit}
            isStreaming={!!streamingId}
            onStop={handleStop}
            topK={topK}
            onTopKChange={setTopK}
          />

          <SuggestedTopics onPick={handleTopicPick} />
          {hint && (
            <p className="animate-fade-up rounded-full bg-sky-100 px-4 py-1.5 text-xs text-sky-700">
              {hint}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-8">
            {turns.map((turn) => (
              <TurnCard
                key={turn.id}
                turn={turn}
                liveLabel={turn.id === streamingId ? workingLabel : undefined}
              />
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="sticky bottom-0 flex justify-center border-t border-sky-100/60 bg-sky-wash/90 px-4 py-4 backdrop-blur-xl">
            <ChatInput
              mode={mode}
              onModeChange={setMode}
              onSubmit={handleSubmit}
              isStreaming={!!streamingId}
              onStop={handleStop}
              topK={topK}
              onTopKChange={setTopK}
            />
          </div>
        </>
      )}
    </div>
  );
}