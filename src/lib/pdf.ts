/**
 * A tiny dependency-free PDF writer (PDF 1.4, A4, built-in Helvetica faces).
 * Coordinates are top-left based in points; the writer flips them for PDF.
 * Text is encoded as WinAnsi so €, £, •, – and — render with the standard fonts.
 */

export type RGB = [number, number, number];
type Font = "R" | "B" | "I";

const W = 595.28;
const H = 841.89;

// Helvetica advance widths (1/1000 em) for ASCII 32–126.
const HELV = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556,
  556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556,
  556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
];

const WIN_ANSI: Record<string, number> = {
  "€": 0x80, "‚": 0x82, "„": 0x84, "…": 0x85, "‘": 0x91, "’": 0x92, "“": 0x93, "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97, "™": 0x99, "−": 0x2d, "\u2009": 0x20,
};

function encode(s: string) {
  let out = "";
  for (const ch of s) {
    const c = ch.codePointAt(0)!;
    let b: number;
    if (WIN_ANSI[ch] !== undefined) b = WIN_ANSI[ch];
    else if (c === 0x00a0) b = 0x20;
    else if (c >= 0x20 && c < 0x7f) b = c;
    else if (c >= 0xa0 && c <= 0xff) b = c;
    else b = 0x3f; // "?"
    const k = String.fromCharCode(b);
    out += k === "(" || k === ")" || k === "\\" ? "\\" + k : k;
  }
  return out;
}

export function textWidth(s: string, size: number, font: Font = "R") {
  let w = 0;
  for (const ch of s) {
    const c = ch.codePointAt(0)!;
    w += c >= 32 && c <= 126 ? HELV[c - 32] : ch === "•" ? 350 : 556;
  }
  return (w / 1000) * size * (font === "B" ? 1.04 : 1);
}

const n = (v: number) => (Math.round(v * 100) / 100).toString();
const rgb = (c: RGB) => c.map((x) => n(x / 255)).join(" ");

export class PdfDoc {
  readonly width = W;
  readonly height = H;
  private pages: string[][] = [];
  private cur: string[] = [];

  constructor() {
    this.addPage();
  }

  addPage() {
    this.cur = [];
    this.pages.push(this.cur);
  }
  get pageCount() {
    return this.pages.length;
  }
  /** Draw on a specific page (used for "Page x of y" footers). */
  onPage(i: number, fn: () => void) {
    const keep = this.cur;
    this.cur = this.pages[i];
    fn();
    this.cur = keep;
  }

  text(
    x: number,
    y: number,
    s: string,
    o: { size?: number; font?: Font; color?: RGB; align?: "left" | "right" | "center"; maxWidth?: number } = {},
  ) {
    const size = o.size ?? 10;
    const font = o.font ?? "R";
    let str = s;
    if (o.maxWidth) while (str.length > 1 && textWidth(str, size, font) > o.maxWidth) str = str.slice(0, -2) + "…";
    const w = textWidth(str, size, font);
    const tx = o.align === "right" ? x - w : o.align === "center" ? x - w / 2 : x;
    const f = font === "B" ? "F2" : font === "I" ? "F3" : "F1";
    this.cur.push(`BT /${f} ${n(size)} Tf ${rgb(o.color ?? [20, 20, 20])} rg ${n(tx)} ${n(H - y)} Td (${encode(str)}) Tj ET`);
    return w;
  }

  /** Wraps a paragraph to the given width; returns the y below the last line. */
  para(x: number, y: number, s: string, width: number, o: { size?: number; font?: Font; color?: RGB; leading?: number } = {}) {
    const size = o.size ?? 9;
    const lead = o.leading ?? size * 1.45;
    let line = "";
    for (const word of s.split(/\s+/)) {
      const tryLine = line ? line + " " + word : word;
      if (textWidth(tryLine, size, o.font) > width && line) {
        this.text(x, y, line, { size, font: o.font, color: o.color });
        y += lead;
        line = word;
      } else line = tryLine;
    }
    if (line) this.text(x, y, line, { size, font: o.font, color: o.color });
    return y + lead;
  }

  rect(x: number, y: number, w: number, h: number, fill: RGB) {
    this.cur.push(`${rgb(fill)} rg ${n(x)} ${n(H - y - h)} ${n(w)} ${n(h)} re f`);
  }

  line(x1: number, y1: number, x2: number, y2: number, color: RGB = [200, 200, 200], width = 0.5) {
    this.cur.push(`${rgb(color)} RG ${n(width)} w ${n(x1)} ${n(H - y1)} m ${n(x2)} ${n(H - y2)} l S`);
  }

  /** Smooth-ish polyline in round caps — used for hand-drawn signatures. */
  polyline(points: [number, number][], color: RGB, width: number) {
    if (points.length < 2) {
      if (points.length === 1) {
        const [x, y] = points[0];
        this.cur.push(`${rgb(color)} RG ${n(width)} w 1 J ${n(x)} ${n(H - y)} m ${n(x + 0.1)} ${n(H - y)} l S`);
      }
      return;
    }
    const ops = points.map(([x, y], i) => `${n(x)} ${n(H - y)} ${i ? "l" : "m"}`).join(" ");
    this.cur.push(`${rgb(color)} RG ${n(width)} w 1 J 1 j ${ops} S`);
  }

  build(meta: { title: string; author?: string } = { title: "Document" }) {
    const objs: string[] = [];
    const add = (s: string) => objs.push(s); // 1-based object id
    const catalog = add("");
    const pagesId = add("");
    const f1 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
    const f2 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
    const f3 = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>");
    const info = add(`<< /Title (${encode(meta.title)}) /Author (${encode(meta.author ?? "Velox")}) /Producer (Velox statement engine) >>`);
    const kids: number[] = [];
    for (const ops of this.pages) {
      const body = ops.join("\n");
      const content = add(`<< /Length ${body.length} >>\nstream\n${body}\nendstream`);
      kids.push(
        add(
          `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${n(W)} ${n(H)}] /Contents ${content} 0 R /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R /F3 ${f3} 0 R >> >> >>`,
        ),
      );
    }
    objs[catalog - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
    objs[pagesId - 1] = `<< /Type /Pages /Kids [${kids.map((k) => k + " 0 R").join(" ")}] /Count ${kids.length} >>`;

    let out = "%PDF-1.4\n%\xe2\xe3\xcf\xd3\n";
    const offsets: number[] = [];
    objs.forEach((o, i) => {
      offsets.push(out.length);
      out += `${i + 1} 0 obj\n${o}\nendobj\n`;
    });
    const xref = out.length;
    out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
    for (const off of offsets) out += String(off).padStart(10, "0") + " 00000 n \n";
    out += `trailer\n<< /Size ${objs.length + 1} /Root ${catalog} 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;

    const bytes = new Uint8Array(out.length);
    for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
    return bytes;
  }
}
