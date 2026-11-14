"use client";

import { motion } from "framer-motion";
import { EASE } from "@/lib/motion";

/** Heading whose words rise out of a mask when scrolled into view. */
export default function SplitHeading({
  text,
  className,
  as = "h2",
  delay = 0,
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3";
  delay?: number;
}) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      aria-label={text}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      transition={{ staggerChildren: 0.06, delayChildren: delay }}
    >
      {text.split(" ").map((w, i) => (
        <span key={i}>
          <span className="w" aria-hidden>
            <motion.span
              variants={{ hidden: { y: "110%", rotate: 4 }, show: { y: "0%", rotate: 0 } }}
              transition={{ duration: 1, ease: EASE }}
            >
              {w}
            </motion.span>
          </span>{" "}
        </span>
      ))}
    </Tag>
  );
}
