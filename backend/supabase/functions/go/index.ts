// "Visit store" click-out: GET /functions/v1/go?t=<tracking_id>
// Logs the click, then redirects (302) to the store's link for that offer. This is what earns commission and feeds the admin's
// traffic reports. Deployed 2026-10-14. Deploy with verify_jwt = false (it is a public link). Set SITE_URL to the site address (full https:// address).
//
// Privacy: the visitor is stored only as a salted daily hash of IP + browser, never the raw IP, and no account id is saved.
// Secrets (set in the project, never in the repo): CLICK_SALT. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
import { createClient } from "jsr:@supabase/supabase-js@2";

const TRACKING = /^doabno-[a-z]{2}-[a-z0-9-]+-[a-z0-9-]+$/;
const SITE = Deno.env.get("SITE_URL") ?? "";
// Response.redirect needs a full address; until SITE_URL is set, unknown links get a plain 404 instead of crashing.
const home = () => /^https?:\/\//i.test(SITE) ? Response.redirect(SITE, 302) : new Response("Link not available", { status: 404 });

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method !== "GET" && req.method !== "HEAD") return new Response("Method not allowed", { status: 405 });
  const t = new URL(req.url).searchParams.get("t") ?? "";
  if (!TRACKING.test(t) || t.length > 120) return new Response("Bad link", { status: 400 });

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data: offer } = await db.from("offers")
    .select("product_id, store_id, market, url, stores!inner(active), products!inner(status)")
    .eq("tracking_id", t).maybeSingle();

  // Unknown, paused, hidden or link-less offers go to the site instead of a dead end; nothing is logged for them.
  const target = offer?.url && /^https?:\/\//i.test(offer.url) ? offer.url : null;
  const live = offer && (offer as any).stores?.active && (offer as any).products?.status === "active";
  if (!offer || !live || !target) return home();

  if (req.method === "GET") {
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
    const day = new Date().toISOString().slice(0, 10);
    const visitor = await sha256Hex(`${Deno.env.get("CLICK_SALT") ?? ""}|${day}|${ip}|${req.headers.get("user-agent") ?? ""}`);
    // A failed log must never block the shopper.
    await db.from("clicks").insert({ tracking_id: t, product_id: offer.product_id, store_id: offer.store_id, market: offer.market, visitor_hash: visitor })
      .then(() => {}, () => {});
  }
  return new Response(null, { status: 302, headers: { Location: target, "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
});
