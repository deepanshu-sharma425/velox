"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowLeft, Check, Eye, EyeOff, LoaderCircle } from "lucide-react";
import Fluted from "./Fluted";
import Fx from "./Fx";
import { Logo } from "./Icons";
import SplitHeading from "./SplitHeading";
import { EASE, enter } from "@/lib/motion";
import { isEmail, useStore } from "@/lib/store";

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 14) s++;
  return s;
}
const LEVEL = ["Too short", "Weak", "Okay", "Good", "Strong"];

export default function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const { t, login, signup, user, logout, toast, authReady } = useStore();
  const router = useRouter();
  const isSignup = mode === "signup";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [agree, setAgree] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  // card follows the pointer anywhere on the page
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-1, 1], [14, -14]), { stiffness: 120, damping: 16 });
  const ry = useSpring(useTransform(mx, [-1, 1], [-20, 20]), { stiffness: 120, damping: 16 });
  const tx = useSpring(useTransform(mx, [-1, 1], [-18, 18]), { stiffness: 80, damping: 18 });
  const ty = useSpring(useTransform(my, [-1, 1], [-12, 12]), { stiffness: 80, damping: 18 });
  const sheenX = useTransform(mx, [-1, 1], ["10%", "90%"]);
  const sheen = useTransform(sheenX, (x) => `radial-gradient(60% 90% at ${x} 20%, rgba(255,255,255,0.38), transparent 60%)`);

  const s = strength(pw);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (isSignup && name.trim().length < 2) er.name = t("Please enter your full name.");
    if (!isEmail(email)) er.email = t("Please enter a valid e-mail");
    if (isSignup) {
      if (pw.length < 8 || !/\d/.test(pw) || !/[A-Za-z]/.test(pw)) er.password = t("Password needs 8+ characters with letters and numbers.");
      if (!agree) er.agree = t("Please accept the terms to continue");
    } else if (!pw) er.password = t("Enter your password");
    setErr(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    const res = isSignup ? await signup(name, email, pw) : await login(email, pw, remember);
    setBusy(false);
    if ("error" in res) {
      setErr({ [res.field ?? "form"]: t(res.error) });
      return;
    }
    setDone(true);
    toast(isSignup ? `${t("Welcome to Velox")}, ${res.user.name.split(" ")[0]}!` : `${t("Welcome back")}, ${res.user.name.split(" ")[0]}!`);
    setTimeout(() => router.push("/"), 900);
  };

  return (
    <main
      className="auth"
      onPointerMove={(e) => {
        mx.set((e.clientX / window.innerWidth) * 2 - 1);
        my.set((e.clientY / window.innerHeight) * 2 - 1);
      }}
    >
      <div className="auth-bg">
        <Fluted preset="hero" />
      </div>

      <motion.header className="auth-top" {...enter(0.05, -16)}>
        <Link href="/" className="auth-logo" aria-label="Velox home">
          <Logo />
        </Link>
        <Link href="/" className="auth-back">
          <ArrowLeft strokeWidth={1.4} /> {t("Back to site")}
        </Link>
      </motion.header>

      <div className="auth-grid">
        <section className="auth-hero">
          <motion.p className="hero-kicker" {...enter(0.15, 12)}>
            {isSignup ? t("Join 30K+ customers") : t("Over 30K+ customers chose us.")}
          </motion.p>
          <SplitHeading as="h1" className="h-xl auth-title" text={isSignup ? t("Create your account") : t("Welcome back")} delay={0.2} />
          <motion.p className="lead auth-lead" {...enter(0.5, 16)}>
            {isSignup
              ? t("Open your Velox profile in a minute. Track loans, payments and rewards in one place.")
              : t("Log in to manage your loans, payments and loyalty rewards.")}
          </motion.p>
          <motion.div className="auth-card-wrap" style={{ x: tx, y: ty }} {...enter(0.6, 40)}>
            <motion.div className="auth-card" style={{ rotateX: rx, rotateY: ry, transformPerspective: 1100 }}>
              <div className="vcard-face">
                <div className="vcard-flutes" />
                <motion.div className="vcard-sheen" style={{ background: sheen }} />
                <div className="vcard-top">
                  <Logo />
                </div>
                <div className="vcard-chip" aria-hidden>
                  <i />
                  <i />
                  <i />
                </div>
                <div className="vcard-num">4821&nbsp;&nbsp;••••&nbsp;&nbsp;••••&nbsp;&nbsp;7390</div>
                <div className="vcard-bottom">
                  <div>
                    <span>{t("Card holder")}</span>
                    <b>{(name || user?.name || "YOUR NAME").toUpperCase().slice(0, 22)}</b>
                  </div>
                  <em>debit</em>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        <motion.section
          className="auth-panel glass"
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, ease: EASE, delay: 0.3 }}
        >
          {authReady && user && !done ? (
            <div className="auth-signed">
              <span className="acc-avatar big">{user.name.charAt(0).toUpperCase()}</span>
              <h2 className="h-md">{t("You’re signed in")}</h2>
              <p className="small-muted">{user.email}</p>
              <div className="auth-row">
                <button className="btn btn-ghost" onClick={() => logout()}>
                  {t("Log out")}
                </button>
                <Link className="btn btn-primary" href="/">
                  {t("Go to Velox")}
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <div className="auth-tabs">
                <Link href="/login" className={!isSignup ? "is-active" : ""}>
                  {t("Log in")}
                </Link>
                <Link href="/signup" className={isSignup ? "is-active" : ""}>
                  {t("Sign up")}
                </Link>
                <motion.span className="auth-tab-pill" layoutId="auth-tab" style={{ left: isSignup ? "50%" : "0.4rem" }} />
              </div>

              {isSignup && (
                <label className={`mfield ${err.name ? "has-error" : ""}`}>
                  <span className="mfield-label">{t("Full name")}</span>
                  <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Jane Doe" />
                  {err.name && <span className="field-error">{err.name}</span>}
                </label>
              )}
              <label className={`mfield ${err.email ? "has-error" : ""}`}>
                <span className="mfield-label">{t("E-mail")}</span>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" placeholder="you@example.com" />
                {err.email && <span className="field-error">{err.email}</span>}
              </label>
              <label className={`mfield ${err.password ? "has-error" : ""}`}>
                <span className="mfield-label">{t("Password")}</span>
                <span className="pw">
                  <input
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    type={show ? "text" : "password"}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    placeholder={isSignup ? t("8+ characters") : "••••••••"}
                  />
                  <button type="button" className="pw-toggle" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"}>
                    {show ? <EyeOff strokeWidth={1.4} /> : <Eye strokeWidth={1.4} />}
                  </button>
                </span>
                {err.password && <span className="field-error">{err.password}</span>}
              </label>

              {isSignup && (
                <div className="strength" aria-live="polite">
                  <div className="strength-bars">
                    {[0, 1, 2, 3].map((i) => (
                      <motion.i key={i} animate={{ scaleX: i < s ? 1 : 0 }} transition={{ duration: 0.35, ease: EASE }} className={`lvl-${s}`} />
                    ))}
                  </div>
                  <span>{pw ? t(LEVEL[s]) : t("Use letters, numbers and a symbol")}</span>
                </div>
              )}

              {isSignup ? (
                <label className={`check ${err.agree ? "has-error" : ""}`}>
                  <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                  <span className="check-box">
                    <Check strokeWidth={2.2} />
                  </span>
                  <span>{t("I agree to the Terms of Use and Privacy Policy.")}</span>
                </label>
              ) : (
                <div className="auth-row between">
                  <label className="check">
                    <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                    <span className="check-box">
                      <Check strokeWidth={2.2} />
                    </span>
                    <span>{t("Remember me")}</span>
                  </label>
                  <button
                    type="button"
                    className="inline-link small"
                    onClick={() =>
                      isEmail(email)
                        ? toast(t("If an account exists, a reset link has been sent."))
                        : setErr({ email: t("Enter your e-mail first") })
                    }
                  >
                    {t("Forgot password?")}
                  </button>
                </div>
              )}
              {err.agree && <p className="field-error static">{err.agree}</p>}
              {err.form && <p className="auth-error">{err.form}</p>}

              <button className={`btn btn-primary auth-submit ${done ? "is-done" : ""}`} type="submit" disabled={busy || done}>
                {busy ? <LoaderCircle className="spin-sm" strokeWidth={1.6} /> : done ? <Check strokeWidth={2} /> : null}
                {done ? t("Success") : isSignup ? t("Create account") : t("Log in")}
              </button>

              <p className="auth-switch">
                {isSignup ? t("Already have an account?") : t("Don’t have an account?")}{" "}
                <Link href={isSignup ? "/login" : "/signup"} className="inline-link">
                  {isSignup ? t("Log in") : t("Sign up")}
                </Link>
              </p>
            </form>
          )}
        </motion.section>
      </div>
      <Fx />
    </main>
  );
}
