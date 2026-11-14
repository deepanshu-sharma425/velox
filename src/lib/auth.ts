import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

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

const hashPw = (pw: string, salt: string) => scryptSync(pw, salt, 64).toString("hex");
const pub = ({ id, name, email, createdAt }: StoredUser): User => ({ id, name, email, createdAt });

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);

export async function createUser(name: string, email: string, password: string) {
  const users = await readUsers();
  const e = email.trim().toLowerCase();
  if (users.some((u) => u.email === e)) return { error: "An account with this e-mail already exists." as const };
  const salt = randomBytes(16).toString("hex");
  const u: StoredUser = { id: randomUUID(), name: name.trim(), email: e, createdAt: new Date().toISOString(), salt, hash: hashPw(password, salt) };
  users.push(u);
  await writeUsers(users);
  return { user: pub(u) };
}

export async function checkCredentials(email: string, password: string) {
  const u = (await readUsers()).find((x) => x.email === email.trim().toLowerCase());
  if (!u) {
    hashPw(password, "timing-equalizer"); // keep timing similar for unknown e-mails
    return null;
  }
  const a = Buffer.from(hashPw(password, u.salt), "hex");
  const b = Buffer.from(u.hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b) ? pub(u) : null;
}

export async function findUser(id: string) {
  const u = (await readUsers()).find((x) => x.id === id);
  return u ? pub(u) : null;
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
