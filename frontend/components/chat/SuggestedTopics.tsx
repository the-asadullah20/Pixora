import { FileText, Landmark, Package, BarChart3, ScanFace, Signature } from "lucide-react";

export interface SuggestedTopic {
  label: string;
  icon: typeof FileText;
  hint: string;
}

export const SUGGESTED_TOPICS: SuggestedTopic[] = [
  { label: "Product photo", icon: Package, hint: "Identify a product and find where it's from" },
  { label: "Document or screenshot", icon: FileText, hint: "Extract and explain text from an image" },
  { label: "Landmark", icon: Landmark, hint: "Find out what a place is and its history" },
  { label: "Chart or graph", icon: BarChart3, hint: "Understand data shown in a chart" },
  { label: "Signature", icon: Signature, hint: "Compare or describe a signature" },
  { label: "Face or portrait", icon: ScanFace, hint: "Describe a portrait's style and context" },
];

interface SuggestedTopicsProps {
  onPick: (topic: SuggestedTopic) => void;
}

export function SuggestedTopics({ onPick }: SuggestedTopicsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <span className="mr-1 text-xs font-medium uppercase tracking-wider text-ink-500/70">
        Try uploading:
      </span>
      {SUGGESTED_TOPICS.map((topic) => (
        <button
          key={topic.label}
          type="button"
          onClick={() => onPick(topic)}
          title={topic.hint}
          className="flex items-center gap-1.5 rounded-full border border-sky-200 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-ink-700 transition-colors hover:border-sky-300 hover:bg-white"
        >
          <topic.icon className="h-3.5 w-3.5 text-sky-500" />
          {topic.label}
        </button>
      ))}
    </div>
  );
}
