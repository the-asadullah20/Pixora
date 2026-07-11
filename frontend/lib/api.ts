import type {
  HistoryListResponse,
  SearchMode,
  StreamEvent,
  UploadResponse,
  UserResponse,
} from "./types";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000") + "/api/v1";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function parseErrorDetail(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.detail ?? res.statusText;
  } catch {
    return res.statusText || `Request failed with status ${res.status}`;
  }
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

// ---------------------------------------------------------------------------
// Search — streams Server-Sent Events: description -> sources -> token* -> done | error
// ---------------------------------------------------------------------------

interface StreamSearchParams {
  image: File;
  mode: SearchMode;
  topK?: number;
  token: string;
}

export async function streamSearch(
  { image, mode, topK = 5, token }: StreamSearchParams,
  onEvent: (event: StreamEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const formData = new FormData();
  formData.append("image", image);
  formData.append("mode", mode);
  formData.append("top_k", String(topK));
  formData.append("stream", "true");

  const res = await fetch(`${API_BASE}/search`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
    signal,
  });

  if (!res.ok || !res.body) {
    throw new ApiError(res.status, await parseErrorDetail(res));
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const line = chunk.trim();
      if (!line.startsWith("data:")) continue;
      const jsonStr = line.slice("data:".length).trim();
      if (!jsonStr) continue;
      try {
        onEvent(JSON.parse(jsonStr) as StreamEvent);
      } catch {
        // Malformed/partial chunk — skip rather than crash the stream.
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Upload — indexes an image into the Picture Search knowledge base
// ---------------------------------------------------------------------------

export async function uploadImage(
  image: File,
  token: string,
  opts?: { title?: string; tags?: string[] }
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("image", image);
  if (opts?.title) formData.append("title", opts.title);
  if (opts?.tags?.length) formData.append("tags", opts.tags.join(","));

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });
  if (!res.ok) throw new ApiError(res.status, await parseErrorDetail(res));
  return res.json();
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

export async function listHistory(
  token: string,
  opts?: { limit?: number; before?: string }
): Promise<HistoryListResponse> {
  const params = new URLSearchParams();
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.before) params.set("before", opts.before);

  const res = await fetch(`${API_BASE}/history?${params.toString()}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new ApiError(res.status, await parseErrorDetail(res));
  return res.json();
}

export async function deleteHistoryItem(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/history/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok && res.status !== 204) throw new ApiError(res.status, await parseErrorDetail(res));
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function getMe(token: string): Promise<UserResponse> {
  const res = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders(token) });
  if (!res.ok) throw new ApiError(res.status, await parseErrorDetail(res));
  return res.json();
}
