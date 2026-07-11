// Mirrors backend/app/models/schemas.py — keep these in sync with the API.

export type SearchMode = "picture" | "internet";

export interface SourceItem {
  source: string;
  content: string;
  score: number;
}

export interface SearchResponse {
  mode: SearchMode;
  image_description: string;
  sources: SourceItem[];
  answer: string;
  history_id: string | null;
}

export type StreamEventType = "description" | "sources" | "token" | "done" | "error";

export interface StreamEvent {
  type: StreamEventType;
  data: unknown;
}

export interface UploadResponse {
  vector_id: string;
  description: string;
  indexed: boolean;
}

export interface HistoryItem {
  id: string;
  mode: SearchMode | null;
  image_description: string;
  sources: SourceItem[];
  answer: string;
  created_at: string | null;
}

export interface HistoryListResponse {
  items: HistoryItem[];
  next_cursor: string | null;
}

export interface UserResponse {
  uid: string;
  email: string | null;
  email_verified: boolean;
  provider: string | null;
}

// --- Frontend-only conversation model, built up from the SSE stream ---

export interface ChatTurn {
  id: string;
  mode: SearchMode;
  imagePreviewUrl: string;
  description: string | null;
  sources: SourceItem[];
  answer: string;
  status: "analyzing" | "retrieving" | "answering" | "done" | "error";
  errorMessage?: string;
  historyId?: string | null;
}
