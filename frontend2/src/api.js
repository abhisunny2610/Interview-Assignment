// Base URLs
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";
const FALLBACK_BASE = API_BASE.endsWith("/api")
  ? API_BASE.replace(/\/api$/, "")
  : API_BASE;

// Generic request helper
async function request(path, init) {
  const primary = await fetch(`${API_BASE}${path}`, init).catch(() => null);
  if (primary && primary.ok) return primary;

  const fallback = await fetch(`${FALLBACK_BASE}${path}`, init).catch(() => null);
  if (fallback && fallback.ok) return fallback;

  if (primary) {
    throw new Error(`API request failed (${primary.status}) at ${API_BASE}${path}`);
  }
  if (fallback) {
    throw new Error(`API request failed (${fallback.status}) at ${FALLBACK_BASE}${path}`);
  }

  throw new Error(
    `Cannot reach backend. Tried ${API_BASE}${path} and ${FALLBACK_BASE}${path}. Is backend running?`
  );
}

// 📦 Fetch videos
export async function fetchVideos() {
  const response = await request("/videos");
  const data = await response.json();
  return data.items;
}

export function getOrCreateUserId() {
  const key = "carousel:userId";
  const existing = localStorage.getItem(key);
  if (existing) return existing;

  let id = "";
  try {
    id = crypto?.randomUUID?.() || "";
  } catch {
    id = "";
  }
  if (!id) {
    id = `user_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
  localStorage.setItem(key, id);
  return id;
}

export async function fetchUserReactions(user) {
  const response = await request(`/reactions?user=${encodeURIComponent(user)}`);
  const data = await response.json();
  return data.reactions || [];
}

// ❤️ Like / Dislike
export async function reactVideo(videoId, action, user = "guest") {
  const response = await request("/like", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      videoId,
      user,
      action, // "like" | "dislike" | "none"
    }),
  });

  return await response.json();
}

// 🔗 Share
export async function shareVideo(videoId) {
  await request("/share", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      videoId,
      platform: "copy-link",
    }),
  });
}

// 💬 Comment
export async function postComment(videoId, message) {
  const response = await request("/comment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      videoId,
      user: "guest",
      message,
    }),
  });

  const data = await response.json();
  return data.commentsCount;
}