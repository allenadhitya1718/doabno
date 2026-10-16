// Photo identification with Gemini: POST /functions/v1/identify. The work is in core.mjs (tested by backend/tests/identify.test.js).
// Deploy with verify_jwt = false (see supabase/config.toml): the function checks the public key itself so the browser's preflight request works.
// Secrets (set in the Supabase project, never in the repo): GEMINI_API_KEY. SUPABASE_ANON_KEY is provided by Supabase.
import { createLimiter, handle } from "./core.mjs";

const limiter = createLimiter({ globalDay: Number(Deno.env.get("IDENTIFY_DAILY_CAP") ?? 1000) });

async function hash(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode((Deno.env.get("IDENTIFY_SALT") ?? "") + text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve((req) => handle(req, { env: (name: string) => Deno.env.get(name), fetchImpl: fetch, limiter, hash }));
