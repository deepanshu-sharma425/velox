import { rateLimited } from "@/lib/auth";
import { buildStatement, parseStatement } from "@/lib/statement";

const MAX_BYTES = 128 * 1024;

/** POST JSON loan terms → loan agreement + amortization statement as a PDF. */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (rateLimited("pdf:" + ip, 30)) return Response.json({ error: "Slow down." }, { status: 429 });

  const raw = await req.text();
  if (raw.length > MAX_BYTES) return Response.json({ error: "Payload too large." }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const input = parseStatement(body);
  if (typeof input === "string") return Response.json({ error: input }, { status: 400 });

  const pdf = buildStatement(input);
  const file = `velox-${(input.id ?? "loan-quote").toLowerCase().replace(/[^a-z0-9-]/g, "")}.pdf`;
  return new Response(pdf.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${file}"`,
      "Cache-Control": "no-store",
    },
  });
}
