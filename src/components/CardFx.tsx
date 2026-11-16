"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Snowflake } from "lucide-react";
import { Logo } from "./Icons";

/* =========================================================
   Frost shader — a WebGL fragment shader that grows ice
   crystals in from the card edges while the card freezes,
   and melts them back out when it is unfrozen.
   ========================================================= */

const VERT = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;

const FRAG = `
precision mediump float;
uniform vec2 r;
uniform float t;
uniform float p;
float h(vec2 q){return fract(sin(dot(q,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 q){vec2 i=floor(q),f=fract(q);f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 q){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(q);q=q*2.03+vec2(1.7,9.2);a*=.5;}return v;}
float ridge(vec2 q){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*(1.-abs(n(q)*2.-1.));q=q*2.1+3.1;a*=.5;}return v;}
vec2 vor(vec2 q){vec2 i=floor(q),f=fract(q);float d1=8.,d2=8.;
  for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 g=vec2(float(x),float(y));
    vec2 o=vec2(h(i+g),h(i+g+19.7));vec2 d=g+o-f;float l=dot(d,d);
    if(l<d1){d2=d1;d1=l;}else if(l<d2){d2=l;}}
  return vec2(sqrt(d1),sqrt(d2));}
void main(){
  vec2 uv=gl_FragCoord.xy/r;
  float asp=r.x/r.y;
  vec2 q=vec2(uv.x*asp,uv.y);
  float edge=min(min(uv.x,1.-uv.x)*asp,min(uv.y,1.-uv.y));
  float front=p*1.25-edge+(fbm(q*5.+3.)-.5)*.42;
  float cover=smoothstep(0.,.14,front);
  if(cover<=0.001){gl_FragColor=vec4(0.);return;}
  vec2 v=vor(q*7.5);
  float cells=smoothstep(.07,0.,v.y-v.x);
  float rd=pow(ridge(q*8.+vec2(0.,p*.6)),3.2);
  float haze=fbm(q*13.+t*.015);
  float spark=pow(h(floor(q*110.)+floor(t*3.)),70.)*step(.6,cover);
  float rim=smoothstep(.1,0.,abs(front-.05))*(1.-smoothstep(.95,1.,p));
  float a=cover*(.22+.32*haze)+cells*cover*.28+rd*cover*.6+rim*.3+spark;
  a=clamp(a,0.,.9);
  vec3 col=mix(vec3(.86,.91,.97),vec3(1.),clamp(rd*.9+spark+rim,0.,1.));
  gl_FragColor=vec4(col*a,a);
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
  return s;
}

export function FrostShader({ frozen }: { frozen: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const target = useRef(frozen ? 1 : 0);
  const [fallback, setFallback] = useState(false);
  target.current = frozen ? 1 : 0;

  useEffect(() => {
    const canvas = ref.current!;
    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) {
      setFallback(true);
      return;
    }
    let prog: WebGLProgram;
    try {
      prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error("link");
    } catch {
      setFallback(true);
      return;
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uR = gl.getUniformLocation(prog, "r");
    const uT = gl.getUniformLocation(prog, "t");
    const uP = gl.getUniformLocation(prog, "p");

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let p = target.current;
    let visible = true;
    let raf = 0;
    let last = 0;
    let lastDraw = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    const draw = (now: number) => {
      resize();
      gl.uniform2f(uR, canvas.width, canvas.height);
      gl.uniform1f(uT, now / 1000);
      gl.uniform1f(uP, p);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (p > 0.001) gl.drawArrays(gl.TRIANGLES, 0, 3);
      lastDraw = now;
    };
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      const goal = target.current;
      const moving = Math.abs(goal - p) > 0.001;
      if (moving) {
        // freeze takes ~1.4s, thaw ~0.9s
        const speed = goal > p ? 0.75 : 1.15;
        p = reduced ? goal : goal > p ? Math.min(goal, p + dt * speed) : Math.max(goal, p - dt * speed);
        draw(now);
      } else if (p > 0 && visible && !reduced && now - lastDraw > 80) {
        draw(now); // slow sparkle while frozen
      }
    };
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);
    draw(performance.now());
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  if (fallback) return <div className={`frost-fallback ${frozen ? "is-on" : ""}`} aria-hidden />;
  return <canvas ref={ref} className="frost-canvas" aria-hidden />;
}

/** "Frozen" badge that pops onto the card face. */
export function FrozenBadge({ frozen, label }: { frozen: boolean; label: string }) {
  return (
    <motion.span
      className="frost-badge"
      initial={false}
      animate={frozen ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.6, y: -8 }}
      transition={{ type: "spring", stiffness: 380, damping: 22, delay: frozen ? 0.6 : 0 }}
      aria-hidden={!frozen}
    >
      <Snowflake strokeWidth={1.8} /> {label}
    </motion.span>
  );
}

/* =========================================================
   Card back — magnetic stripe, signature panel with CVV,
   hologram and the full card number (revealed on demand).
   ========================================================= */

export function VCardBack({
  holder,
  first4,
  mid,
  last4,
  cvv,
  expiry,
  frozen,
  labels,
}: {
  holder: string;
  first4: string;
  mid: string;
  last4: string;
  cvv: string;
  expiry: string;
  frozen?: boolean;
  labels: { reveal: string; hide: string; frozen: string; authorized: string; service: string };
}) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!shown) return;
    const id = setTimeout(() => setShown(false), 8000);
    return () => clearTimeout(id);
  }, [shown]);

  return (
    <div className={`vcard-face vcard-back ${frozen ? "is-frozen" : ""}`}>
      <div className="vcard-flutes" />
      <p className="vback-service">{labels.service}</p>
      <div className="vback-stripe" aria-hidden />
      <div className="vback-row">
        <div className="vback-sig">
          <span className="vback-sig-label">{labels.authorized}</span>
          <span className="vback-sig-name">{holder || "—"}</span>
        </div>
        <div className="vback-cvv" aria-live="polite">
          <span>CVV</span>
          <b>{shown ? cvv : "•••"}</b>
        </div>
      </div>
      <div className="vback-details">
        <div className="vback-num">
          {first4}&nbsp;&nbsp;{shown ? mid.replace(" ", "  ") : "••••  ••••"}&nbsp;&nbsp;{last4}
          <small>{expiry}</small>
        </div>
        <button
          type="button"
          className="vback-reveal"
          onClick={(e) => {
            e.stopPropagation();
            setShown((v) => !v);
          }}
          aria-pressed={shown}
        >
          {shown ? <EyeOff strokeWidth={1.6} /> : <Eye strokeWidth={1.6} />}
          {shown ? labels.hide : labels.reveal}
        </button>
      </div>
      <div className="vback-foot">
        <span className="vback-holo" aria-hidden />
        <small>Velox Bank, N.A. · Member FDIC · This card is property of Velox and must be returned upon request.</small>
        <Logo />
      </div>
      <FrostShader frozen={!!frozen} />
      <FrozenBadge frozen={!!frozen} label={labels.frozen} />
    </div>
  );
}

/* =========================================================
   Flip wrapper — front and back in one preserve-3d stack.
   ========================================================= */

export function CardFlip({
  flipped,
  front,
  back,
  onToggle,
  label,
}: {
  flipped: boolean;
  front: React.ReactNode;
  back: React.ReactNode;
  onToggle?: () => void;
  label?: string;
}) {
  return (
    <motion.div
      className={`vflip ${onToggle ? "is-clickable" : ""}`}
      initial={false}
      animate={{ rotateY: flipped ? 180 : 0 }}
      transition={{ type: "spring", stiffness: 80, damping: 14, mass: 0.9 }}
      style={{ transformPerspective: 1600 }}
      onClick={onToggle}
      role={onToggle ? "button" : undefined}
      tabIndex={onToggle ? 0 : undefined}
      aria-label={label}
      aria-pressed={onToggle ? flipped : undefined}
      onKeyDown={(e) => {
        if (onToggle && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      <div className="vflip-face" aria-hidden={flipped}>
        {front}
      </div>
      <div className="vflip-face is-back" aria-hidden={!flipped}>
        {back}
      </div>
    </motion.div>
  );
}
