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

  await setUserData(user.id, { loans: d.loans, subscriptions: d.subscriptions, calls: d.calls });
  return Response.json({ ok: true });
}
