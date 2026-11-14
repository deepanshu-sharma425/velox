import { cookies } from "next/headers";
import { COOKIE, findUser, verifyJwt } from "@/lib/auth";

export async function GET(req: Request) {
  const store = await cookies();
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const payload = await verifyJwt<{ sub: string }>(bearer || store.get(COOKIE)?.value);
  // 200 + null (not 401) so signed-out visitors don't get console errors
  if (!payload) return Response.json({ user: null });
  const user = await findUser(payload.sub);
  if (!user) return Response.json({ user: null });
  return Response.json({ user });
}
