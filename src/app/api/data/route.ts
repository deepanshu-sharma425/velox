import { cookies } from "next/headers";
import { COOKIE, getUserData, rateLimited, sessionUser, setUserData } from "@/lib/auth";

const MAX_BYTES = 256 * 1024;

export async function GET(req: Request) {
  const user = await sessionUser(req, (await cookies()).get(COOKIE)?.value);
  if (!user) return Response.json({ error: "Not signed in." }, { status: 401 });
  return Response.json({ data: await getUserData(user.id) });
}

export async function PUT(req: Request) {
  const user = await sessionUser(req, (await cookies()).get(COOKIE)?.value);
  if (!user) return Response.json({ error: "Not signed in." }, { status: 401 });
  if (rateLimited("data:" + user.id, 60)) return Response.json({ error: "Slow down." }, { status: 429 });

  const raw = await req.text();
  if (raw.length > MAX_BYTES) return Response.json({ error: "Payload too large." }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const d = body as Record<string, unknown>;
  if (!d || typeof d !== "object" || !["loans", "subscriptions", "calls"].every((k) => Array.isArray(d[k])))
    return Response.json({ error: "Invalid data shape." }, { status: 400 });

  const out: Record<string, unknown> = { loans: d.loans, subscriptions: d.subscriptions, calls: d.calls };
  const card = cleanCard(d.card);
  if (card) out.card = card;
  await setUserData(user.id, out);
  return Response.json({ ok: true });
}

/** Card controls: four booleans and a monthly spending limit (USD base). */
function cleanCard(v: unknown) {
  if (!v || typeof v !== "object") return null;
  const c = v as Record<string, unknown>;
  const bools = ["frozen", "online", "contactless", "atm"] as const;
  if (!bools.every((k) => typeof c[k] === "boolean")) return null;
  const limit = Number(c.limit);
  if (!Number.isFinite(limit) || limit < 0 || limit > 1_000_000) return null;
  return { frozen: c.frozen, online: c.online, contactless: c.contactless, atm: c.atm, limit: Math.round(limit) };
}
