import { neon, NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Neon Postgres access. The schema is created on first use, so a fresh
 * database works without running migrations by hand.
 */

let client: NeonQueryFunction<false, false> | null = null;
let schemaReady: Promise<void> | null = null;

export const hasDb = () => Boolean(process.env.DATABASE_URL);

export function sql() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  if (!client) client = neon(process.env.DATABASE_URL);
  return client;
}

export function ensureSchema() {
  if (!schemaReady) {
    const q = sql();
    schemaReady = (async () => {
      await q`
        CREATE TABLE IF NOT EXISTS velox_users (
          id          uuid PRIMARY KEY,
          name        text NOT NULL,
          email       text NOT NULL UNIQUE,
          hash        text NOT NULL,
          salt        text NOT NULL,
          created_at  timestamptz NOT NULL DEFAULT now()
        )`;
      await q`
        CREATE TABLE IF NOT EXISTS velox_user_data (
          user_id     uuid PRIMARY KEY REFERENCES velox_users(id) ON DELETE CASCADE,
          data        jsonb NOT NULL DEFAULT '{}'::jsonb,
          updated_at  timestamptz NOT NULL DEFAULT now()
        )`;
    })().catch((e) => {
      schemaReady = null; // retry on next request
      throw e;
    });
  }
  return schemaReady;
}
