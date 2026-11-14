import { cookies } from "next/headers";
import { COOKIE, cookieOptions, createUser, isEmail, rateLimited, signJwt } from "@/lib/auth";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (rateLimited("signup:" + ip, 10)) return Response.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });

  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const password = String(body.password ?? "");

  if (name.length < 2) return Response.json({ error: "Please enter your full name.", field: "name" }, { status: 400 });
  if (!isEmail(email)) return Response.json({ error: "Please enter a valid e-mail.", field: "email" }, { status: 400 });
  if (password.length < 8 || !/\d/.test(password) || !/[A-Za-z]/.test(password))
    return Response.json({ error: "Password needs 8+ characters with letters and numbers.", field: "password" }, { status: 400 });

  const res = await createUser(name, email, password);
  if ("error" in res) return Response.json({ error: res.error, field: "email" }, { status: 409 });

  const token = await signJwt({ sub: res.user.id, email: res.user.email, name: res.user.name });
  (await cookies()).set(COOKIE, token, cookieOptions);
  return Response.json({ user: res.user, token }, { status: 201 });
}
