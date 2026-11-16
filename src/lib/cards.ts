/** Bank-card input helpers shared by the loan and payment flows. */

export const cardDigits = (s: string) => s.replace(/\D/g, "");

/** Groups digits in fours while typing ("4111111" → "4111 111"). Up to 19 digits. */
export const fmtCard = (s: string) =>
  cardDigits(s)
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ");

/**
 * A card number is accepted when it has 13–19 digits and isn't a single
 * repeated digit. This is a demo bank, so we don't reject numbers that fail
 * the Luhn checksum — customers type their own made-up numbers.
 */
export const cardValid = (s: string) => {
  const d = cardDigits(s);
  return d.length >= 13 && d.length <= 19 && !/^(\d)\1+$/.test(d);
};

export const cardBrand = (s: string) => {
  const d = cardDigits(s);
  if (/^4/.test(d)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(d)) return "mastercard";
  if (/^3[47]/.test(d)) return "amex";
  if (/^6/.test(d)) return "discover";
  return d ? "card" : "";
};

/** "4111 11" → "4111  11••  ••••  ••••" for the live card preview. */
export const cardPreview = (s: string) => {
  const d = cardDigits(s).slice(0, 16).padEnd(16, "•");
  return d.replace(/(.{4})(?=.)/g, "$1  ");
};

export const fmtExp = (s: string) => {
  const d = s.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
};

export const expValid = (s: string) => {
  const m = /^(\d{2})\/(\d{2})$/.exec(s);
  if (!m) return false;
  const mo = Number(m[1]);
  if (mo < 1 || mo > 12) return false;
  return new Date(2000 + Number(m[2]), mo, 0, 23, 59) >= new Date();
};
