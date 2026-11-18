// Optional lightweight server-side route template (Node.js/Next.js/Express)
// ponytail: single-file proxy handler; add robust schema parsing and rate limiting when traffic grows.

import crypto from "node:crypto";

const LRCLIB_API = "https://lrclib.net/api";
const LRCLIB_CLIENT = "Sasayaki LRCLIB Publisher/1.0 (https://sasayaki-lrc-publisher.vercel.app)";

function compareBytes(a, b) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }
  return 0;
}

function solveChallenge(prefix, targetHex) {
  const target = Buffer.from(targetHex, "hex");
  let nonce = 0;
  while (true) {
    const digest = crypto.createHash("sha256").update(`${prefix}${nonce}`).digest();
    if (compareBytes(digest, target) <= 0) return String(nonce);
    nonce++;
  }
}

export function validatePublishPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return "Request body must be a JSON object";
  if (!["trackName", "artistName", "albumName"].every(key => typeof payload[key] === "string" && payload[key].trim())) {
    return "Track name, artist name, and album name are required";
  }
  if (!Number.isFinite(Number(payload.duration)) || Number(payload.duration) <= 0) {
    return "Duration must be a number greater than 0 seconds";
  }
  if (!(typeof payload.plainLyrics === "string" && payload.plainLyrics.trim()) && !(typeof payload.syncedLyrics === "string" && payload.syncedLyrics.trim())) {
    return "Plain lyrics or synced lyrics are required";
  }
  if (payload.syncedLyrics && payload.syncedLyrics.split(/\r?\n/).some(line => line.trim() && !/^\[\d{1,3}:\d{2}(?:\.\d{1,3})?\]/.test(line.trim()))) {
    return "Synced lyrics contain an invalid timestamp line";
  }
  return null;
}

export async function publishToLrclib(payload) {
  const challengeRes = await fetch(`${LRCLIB_API}/request-challenge`, {
    method: "POST",
    headers: { "Lrclib-Client": LRCLIB_CLIENT }
  });
  if (!challengeRes.ok) {
    const errText = await challengeRes.text();
    throw new Error(`Challenge request failed: HTTP ${challengeRes.status} ${errText}`);
  }
  const { prefix, target } = await challengeRes.json();
  const nonce = solveChallenge(prefix, target);

  const publishRes = await fetch(`${LRCLIB_API}/publish`, {
    method: "POST",
    headers: {
      "Lrclib-Client": LRCLIB_CLIENT,
      "Content-Type": "application/json",
      "X-Publish-Token": `${prefix}:${nonce}`
    },
    body: JSON.stringify(payload)
  });

  const responseText = await publishRes.text();
  let json;
  try { json = responseText ? JSON.parse(responseText) : null; }
  catch { json = { raw: responseText }; }
  if (!publishRes.ok) {
    throw new Error(`Publish failed: HTTP ${publishRes.status} ${responseText}`);
  }
  return { status: publishRes.status, result: json };
}

// Minimal runner assertion
if (process.argv[1]?.endsWith("server-proxy.mjs")) {
  const sampleTarget = "0000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
  const nonce = solveChallenge("test-prefix-", sampleTarget);
  const hash = crypto.createHash("sha256").update(`test-prefix-${nonce}`).digest("hex");
  if (hash > sampleTarget) throw new Error("PoW assertion failed");
}
