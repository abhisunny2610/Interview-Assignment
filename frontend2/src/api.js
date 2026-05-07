const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";
const FALLBACK_BASE = API_BASE.endsWith("/api")
  ? API_BASE.replace(/\/api$/, "")
  : API_BASE;

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

export async function fetchVideos() {
  const response = await request("/videos");
  const data = await response.json();
  return data.items;
}

export async function fetchUserReactions(user) {
  const response = await request(`/reactions`);
  const data = await response.json();
  return data.reactions || [];
}

export async function reactVideo(videoId, action) {
  const response = await request("/like", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      videoId,
      action, 
    }),
  });

  return await response.json();
}


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