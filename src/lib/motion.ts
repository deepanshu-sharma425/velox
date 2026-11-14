export const EASE = [0.2, 0.7, 0.2, 1] as const;

/** Fade + rise when the element scrolls into view (runs once). */
export const reveal = (delay = 0, y = 40) => ({
  initial: { opacity: 0, y },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.9, ease: EASE, delay },
});

/** Cards: rise, slight scale-up, staggered by index. */
export const cardReveal = (i = 0) => ({
  initial: { opacity: 0, y: 60, scale: 0.96 },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.9, ease: EASE, delay: i * 0.1 },
});

/** On-load entrance (hero). */
export const enter = (delay = 0, y = 30) => ({
  initial: { opacity: 0, y },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 1, ease: EASE, delay },
});
