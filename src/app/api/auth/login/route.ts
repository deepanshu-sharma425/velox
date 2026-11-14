import { cookies } from "next/headers";
import { COOKIE, checkCredentials, cookieOptions, rateLimited, signJwt } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const ip = req.headers.get("x-forwarded-for") ?? "local";

  if (rateLimited("login:" + email + ":" + ip, 6))
    return Response.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
  if (!email || !password) return Response.json({ error: "Enter your e-mail and password." }, { status: 400 });

  const user = await checkCredentials(email, password);
  if (!user) return Response.json({ error: "Incorrect e-mail or password." }, { status: 401 });

  const token = await signJwt({ sub: user.id, email: user.email, name: user.name });
  (await cookies()).set(COOKIE, token, { ...cookieOptions, maxAge: body.remember === false ? undefined : cookieOptions.maxAge });
  return Response.json({ user, token });
}
