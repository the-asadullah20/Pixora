import { ExternalLink, FileStack } from "lucide-react";
import type { SourceItem } from "@/lib/types";

function isUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://");
}

export function SourceChip({ source }: { source: SourceItem }) {
  const url = isUrl(source.source) ? source.source : null;
  const label = url ? new URL(url).hostname.replace("www.", "") : source.source;

  const content = (
    <>
      {url ? <ExternalLink className="h-3 w-3 shrink-0" /> : <FileStack className="h-3 w-3 shrink-0" />}
      <span className="truncate">{label}</span>
      <span className="ml-auto shrink-0 font-mono text-[10px] text-sky-500">
        {Math.round(source.score * 100)}%
      </span>
    </>
  );

  const className =
    "flex max-w-[220px] items-center gap-1.5 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs text-ink-600 transition-colors hover:border-sky-300";

  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }
  return <span className={className}>{content}</span>;
}
