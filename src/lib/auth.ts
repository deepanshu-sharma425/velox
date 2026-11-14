import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ensureSchema, hasDb, sql } from "./db";

/**
 * Minimal JWT (HS256) auth with a JSON-file user store.
 * Good for local development; swap the store for a database in production.
 */

export const COOKIE = "velox_token";
const TTL = 60 * 60 * 24 * 7; // 7 days
const DIR = path.join(process.cwd(), ".velox-data");
const USERS = path.join(DIR, "users.json");
const SECRET_FILE = path.join(DIR, "jwt-secret");

export type User = { id: string; name: string; email: string; createdAt: string };
type StoredUser = User & { hash: string; salt: string };

async function ensureDir() {
  await mkdir(DIR, { recursive: true });
}

let secretCache: string | null = null;
async function secret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (secretCache) return secretCache;
  await ensureDir();
  try {
    secretCache = (await readFile(SECRET_FILE, "utf8")).trim();
  } catch {
    secretCache = randomBytes(48).toString("hex");
    await writeFile(SECRET_FILE, secretCache, { mode: 0o600 });
  }
  return secretCache;
}

const b64url = (b: Buffer | string) => Buffer.from(b).toString("base64url");

export async function signJwt(payload: Record<string, unknown>) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify({ ...payload, iat: now, exp: now + TTL }));
  const sig = createHmac("sha256", await secret()).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

export async function verifyJwt<T = Record<string, unknown>>(token: string | undefined): Promise<T | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, b, s] = parts;
  try {
    const header = JSON.parse(Buffer.from(h, "base64url").toString());
    if (header.alg !== "HS256") return null;
    const expected = createHmac("sha256", await secret()).update(`${h}.${b}`).digest();
    const got = Buffer.from(s, "base64url");
    if (got.length !== expected.length || !timingSafeEqual(got, expected)) return null;
    const payload = JSON.parse(Buffer.from(b, "base64url").toString());
    if (typeof payload.exp !== "number" || payload.exp < Date.now() / 1000) return null;
    return payload as T;
  } catch {
    return null;
  }
}

/* ---------- storage: Neon Postgres when DATABASE_URL is set, JSON file otherwise ---------- */

async function readUsers(): Promise<StoredUser[]> {
  try {
    return JSON.parse(await readFile(USERS, "utf8"));
  } catch {
    return [];
  }
}
async function writeUsers(u: StoredUser[]) {
  await ensureDir();
  await writeFile(USERS, JSON.stringify(u, null, 2), { mode: 0o600 });
}

type Row = { id: string; name: string; email: string; hash: string; salt: string; created_at: string | Date };
const fromRow = (r: Row): StoredUser => ({
  id: r.id,
  name: r.name,
  email: r.email,
  hash: r.hash,
  salt: r.salt,
  createdAt: new Date(r.created_at).toISOString(),
});

async function userByEmail(email: string): Promise<StoredUser | null> {
  if (hasDb()) {
    await ensureSchema();
    const rows = (await sql()`SELECT * FROM velox_users WHERE email = ${email} LIMIT 1`) as Row[];
    return rows[0] ? fromRow(rows[0]) : null;
  }
  return (await readUsers()).find((x) => x.email === email) ?? null;
}

async function userById(id: string): Promise<StoredUser | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  if (hasDb()) {
    await ensureSchema();
    const rows = (await sql()`SELECT * FROM velox_users WHERE id = ${id} LIMIT 1`) as Row[];
    return rows[0] ? fromRow(rows[0]) : null;
  }
  return (await readUsers()).find((x) => x.id === id) ?? null;
}

async function insertUser(u: StoredUser): Promise<boolean> {
  if (hasDb()) {
    await ensureSchema();
    const rows = (await sql()`
      INSERT INTO velox_users (id, name, email, hash, salt, created_at)
      VALUES (${u.id}, ${u.name}, ${u.email}, ${u.hash}, ${u.salt}, ${u.createdAt})
      ON CONFLICT (email) DO NOTHING
      RETURNING id`) as { id: string }[];
    return rows.length === 1;
  }
  const users = await readUsers();
  if (users.some((x) => x.email === u.email)) return false;
  users.push(u);
  await writeUsers(users);
  return true;
}

const hashPw = (pw: string, salt: string) => scryptSync(pw, salt, 64).toString("hex");
const pub = ({ id, name, email, createdAt }: StoredUser): User => ({ id, name, email, createdAt });

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);

export async function createUser(name: string, email: string, password: string) {
  const e = email.trim().toLowerCase();
  const salt = randomBytes(16).toString("hex");
  const u: StoredUser = { id: randomUUID(), name: name.trim(), email: e, createdAt: new Date().toISOString(), salt, hash: hashPw(password, salt) };
  if (!(await insertUser(u))) return { error: "An account with this e-mail already exists." as const };
  return { user: pub(u) };
}

export async function checkCredentials(email: string, password: string) {
  const u = await userByEmail(email.trim().toLowerCase());
  if (!u) {
    hashPw(password, "timing-equalizer"); // keep timing similar for unknown e-mails
    return null;
  }
  const a = Buffer.from(hashPw(password, u.salt), "hex");
  const b = Buffer.from(u.hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b) ? pub(u) : null;
}

export async function findUser(id: string) {
  const u = await userById(id);
  return u ? pub(u) : null;
}

/* ---------- per-user app data (loans, payments, subscriptions, calls) ---------- */

const DATA_DIR = path.join(DIR, "user-data");

export async function getUserData(userId: string): Promise<Record<string, unknown> | null> {
  if (hasDb()) {
    await ensureSchema();
    const rows = (await sql()`SELECT data FROM velox_user_data WHERE user_id = ${userId}`) as { data: Record<string, unknown> }[];
    return rows[0]?.data ?? null;
  }
  try {
    return JSON.parse(await readFile(path.join(DATA_DIR, userId + ".json"), "utf8"));
  } catch {
    return null;
  }
}

export async function setUserData(userId: string, data: Record<string, unknown>) {
  if (hasDb()) {
    await ensureSchema();
    await sql()`
      INSERT INTO velox_user_data (user_id, data, updated_at)
      VALUES (${userId}, ${JSON.stringify(data)}::jsonb, now())
      ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`;
    return;
  }
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(path.join(DATA_DIR, userId + ".json"), JSON.stringify(data), { mode: 0o600 });
}

/** Resolve the signed-in user from the JWT cookie (or Bearer header). */
export async function sessionUser(req: Request, cookieValue: string | undefined) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const payload = await verifyJwt<{ sub: string }>(bearer || cookieValue);
  return payload ? findUser(payload.sub) : null;
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: TTL,
};

/** Tiny in-memory rate limiter (per key, sliding window). */
const hits = new Map<string, number[]>();
export function rateLimited(key: string, max = 8, windowMs = 60_000) {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  return arr.length > max;
}
