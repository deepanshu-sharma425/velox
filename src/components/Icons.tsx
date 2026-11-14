type P = { className?: string };

export function Logo({ className }: P) {
  return (
    <span className={"logo " + (className ?? "")} aria-label="Velox">
      <svg viewBox="0 0 21 26" className="logo-v" aria-hidden>
        <path d="M0 0h4.5v18.4L15.7 0H21L5.6 26H0z" fill="currentColor" />
      </svg>
      <span className="logo-text">elox</span>
    </span>
  );
}

export function IconInstagram({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconTiktok({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M16.6 3h-3.1v12.2a2.7 2.7 0 1 1-2.7-2.7c.3 0 .5 0 .8.1V9.4a5.9 5.9 0 1 0 5 5.8V9.1a7.6 7.6 0 0 0 4.4 1.4V7.4A4.4 4.4 0 0 1 16.6 3z" />
    </svg>
  );
}

export function IconThreads({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <path d="M17.5 8.2C16.6 5.4 14.6 4 12.1 4 8 4 5.5 7 5.5 12s2.5 8 6.6 8c3.2 0 5.6-1.8 5.6-4.5 0-2.4-2-3.9-5.2-3.9-2.2 0-3.5 1-3.5 2.4 0 1.3 1.1 2.2 2.6 2.2 2.4 0 3.6-1.9 3.6-5.1 0-2.2-1.1-3.6-3.1-3.6-1.3 0-2.3.6-2.8 1.5" />
    </svg>
  );
}

export function IconYoutube({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.6 2.6 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.6 2.6 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3L10 15z" />
    </svg>
  );
}

export function Stars({ n, className }: { n: number; className?: string }) {
  return (
    <span className={"stars " + (className ?? "")} aria-label={`${n} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 20 20" className={i < n ? "on" : "off"} aria-hidden>
          <path d="M10 1.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L10 15l-5.4 2.9 1.1-6.1L1.2 7.6l6.1-.8z" fill="currentColor" />
        </svg>
      ))}
    </span>
  );
}

/** Account icon matching the design (round head + soft body). */
export function IconUser({ className }: P) {
  return (
    <svg viewBox="0 0 20 22" className={className} fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      <circle cx="10" cy="6.5" r="4.6" />
      <path d="M2.2 17.3c0-1.7 1.3-3 3-3h9.6c1.7 0 3 1.3 3 3v.3a2.8 2.8 0 0 1-2.8 2.8H5a2.8 2.8 0 0 1-2.8-2.8z" />
    </svg>
  );
}
