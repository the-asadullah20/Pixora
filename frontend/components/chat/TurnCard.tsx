import { AlertCircle, Database, Globe, Loader2, Sparkles } from "lucide-react";
import { RabbitMascot } from "@/components/mascot/RabbitMascot";
import type { ChatTurn } from "@/lib/types";
import { SourceChip } from "./SourceChip";

const STATUS_LABEL: Record<ChatTurn["status"], string> = {
  analyzing: "Looking at your image…",
  retrieving: "Retrieving context…",
  answering: "Writing an answer…",
  done: "Done",
  error: "Something went wrong",
};

export function TurnCard({ turn }: { turn: ChatTurn }) {
  const isWorking = turn.status === "analyzing" || turn.status === "retrieving" || turn.status === "answering";

  return (
    <div className="flex flex-col gap-3">
      {/* User's uploaded image, right-aligned like a sent message */}
      <div className="flex justify-end">
        <div className="flex items-center gap-2 rounded-3xl rounded-tr-lg bg-sky-500 p-2 pr-3 shadow-soft">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={turn.imagePreviewUrl}
            alt="Your upload"
            className="h-16 w-16 rounded-2xl object-cover"
          />
          <span className="flex items-center gap-1 text-xs font-medium text-white/90">
            {turn.mode === "picture" ? <Database className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
            {turn.mode === "picture" ? "Picture Search" : "Internet Search"}
          </span>
        </div>
      </div>

      {/* Assistant response, left-aligned */}
      <div className="flex items-start gap-3">
        <RabbitMascot className="mt-1 h-8 w-8 shrink-0" animated={isWorking} />
        <div className="min-w-0 flex-1 rounded-3xl rounded-tl-lg border border-sky-100 bg-white p-4 shadow-card">
          {turn.status === "error" ? (
            <div className="flex items-start gap-2 text-rose-600">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-sm">{turn.errorMessage ?? "The search couldn't be completed."}</p>
            </div>
          ) : (
            <>
              {isWorking && (
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-sky-600">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {STATUS_LABEL[turn.status]}
                </div>
              )}

              {turn.description && (
                <p className="mb-3 rounded-xl bg-sky-50 px-3 py-2 text-xs italic text-ink-500">
                  “{turn.description}”
                </p>
              )}

              {turn.sources.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {turn.sources.map((s, i) => (
                    <SourceChip key={i} source={s} />
                  ))}
                </div>
              )}

              {turn.answer ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-900">
                  {turn.answer}
                  {turn.status === "answering" && (
                    <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-sky-400 align-middle" />
                  )}
                </p>
              ) : (
                !isWorking && (
                  <p className="flex items-center gap-1.5 text-sm text-ink-500">
                    <Sparkles className="h-3.5 w-3.5" /> No answer generated.
                  </p>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
