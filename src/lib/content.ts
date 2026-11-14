export type Plan = {
  id: string;
  name: string;
  min: number;
  max: number;
  term: number;
  firstLoan: string;
  payout: string;
  rate: string;
};

export const PLANS: Plan[] = [
  { id: "common", name: "Common", min: 2000, max: 25000, term: 1, firstLoan: "0% interest", payout: "3 minutes", rate: "0,8%" },
  { id: "standart", name: "Standart", min: 4000, max: 45000, term: 5, firstLoan: "3% interest", payout: "8 minutes", rate: "1,1%" },
  { id: "classic", name: "Classic", min: 3000, max: 30000, term: 24, firstLoan: "2% interest", payout: "5 minutes", rate: "0,9%" },
  { id: "practical", name: "Practical", min: 5000, max: 55000, term: 12, firstLoan: "6% interest", payout: "10 minutes", rate: "1,2%" },
  { id: "effective", name: "Effective", min: 7000, max: 75000, term: 36, firstLoan: "4% interest", payout: "3 minutes", rate: "1,0%" },
];

export type Review = { name: string; avatar: string; stars: number; text: string; date: string };

export const REVIEWS: Review[] = [
  {
    name: "Vanessa Rigo",
    avatar: "/avatars/women-44.jpg",
    stars: 3,
    text: "The flexible repayment terms allowed me to set a payment schedule. Everything feels completely safe, and explicitly designed around the customer’s ultimate comfort.",
    date: "27 Oct, 2026",
  },
  {
    name: "Tom Halender",
    avatar: "/avatars/men-32.jpg",
    stars: 4,
    text: "I chose the standard option and received my money instantly. The platform hidden fees are non-existent, and a transparent calculation helped me plan my budget carefully.",
    date: "27 Oct, 2026",
  },
  {
    name: "Max Colles",
    avatar: "/avatars/men-75.jpg",
    stars: 4,
    text: "I was skeptical at first, but the final contract matches the initial website calculation perfectly. It is a fully reliable service with zero hidden catches.",
    date: "27 Oct, 2026",
  },
  {
    name: "Laura Benett",
    avatar: "/avatars/women-68.jpg",
    stars: 5,
    text: "The application took me four minutes and the decision came almost immediately. Support answered every question I had about early repayment.",
    date: "19 Oct, 2026",
  },
  {
    name: "Daniel Okafor",
    avatar: "/avatars/men-46.jpg",
    stars: 5,
    text: "I used the Classic plan for a car repair. Clear schedule, no surprises, and I closed the loan early without any penalty at all.",
    date: "12 Oct, 2026",
  },
  {
    name: "Sofia Marin",
    avatar: "/avatars/women-65.jpg",
    stars: 4,
    text: "Love the calculator — what I saw on the website is exactly what I signed. The loyalty raffles are a nice bonus on top.",
    date: "03 Oct, 2026",
  },
];

export type Article = {
  tag: string;
  title: string;
  paragraphs: string[];
  subtitle: string;
  bullets: string[];
  reading: string;
};

export const ARTICLES: Article[] = [
  {
    tag: "Support",
    title: "Support for every borrower",
    paragraphs: [
      "Our support team is available 24/7 by phone, e-mail and chat. Every request receives a personal manager who follows your case until it is fully resolved.",
      "Average first response time is under 3 minutes during business hours.",
    ],
    subtitle: "How we can help",
    bullets: [
      "Explain every line of your contract before you sign it.",
      "Help you change the payment date or prolong your loan.",
      "Guide you through early repayment without any extra fees.",
      "Assist with documents, certificates and tax statements.",
    ],
    reading: "6m",
  },
  {
    tag: "FAQ",
    title: "Frequently asked questions",
    paragraphs: [
      "Can I repay early? Yes. Early repayment is always free and the remaining interest is recalculated on the day of payment.",
      "How fast will I get the money? Most applications are approved within 2 minutes and the money is sent straight to your bank card.",
    ],
    subtitle: "More answers",
    bullets: [
      "Do you check my credit history? Yes, with your consent, via official bureaus.",
      "Can I have two loans at once? Yes, if your total limit allows it.",
      "What if I miss a payment? Contact support — we offer prolongation before any penalty applies.",
    ],
    reading: "8m",
  },
  {
    tag: "Consequences",
    title: "Consequences for the Consumer",
    paragraphs: [
      "Repaying your loan on time helps you maintain financial health, improves your official credit history, and unlocks higher borrowing limits for your future plans.",
      "On-time payments improve your credit score for future funding.",
    ],
    subtitle: "Your credit score impact",
    bullets: [
      "Overdue balances may be transferred to official collection agencies or settled in court.",
      "Repeated violations give us the right to demand immediate full repayment.",
      "Active negative records block your access to premium credit products and lower limits.",
      "Late fees are capped by law and always listed in your contract.",
    ],
    reading: "15m",
  },
  {
    tag: "Contract",
    title: "Your loan contract",
    paragraphs: [
      "The contract you sign repeats the exact numbers from the website calculator: principal, interest, service fees and the full payment schedule.",
      "You can withdraw from the contract within 14 days without giving a reason.",
    ],
    subtitle: "What the contract includes",
    bullets: [
      "Fixed interest rate for the entire term.",
      "Complete list of fees — nothing else can be charged.",
      "Your rights for early repayment and prolongation.",
      "Personal data protection terms.",
    ],
    reading: "12m",
  },
  {
    tag: "Other",
    title: "Other useful information",
    paragraphs: [
      "Velox works with licensed partner banks across Europe and North America. All transfers are protected by bank-grade encryption.",
      "You can manage loans, payments and notifications from your personal account at any time.",
    ],
    subtitle: "Good to know",
    bullets: [
      "Promo codes reduce service fees and can be entered in the calculator.",
      "Loyalty members receive invitations to raffles and anniversary events.",
      "Referral bonuses are credited after your friend’s first on-time payment.",
    ],
    reading: "5m",
  },
];

export type CalEvent = { name: string; start: string; end: string };

/** Loyalty events (ISO dates). */
export const EVENTS: CalEvent[] = [
  { name: "Referral Bonus Day", start: "2026-11-04", end: "2026-11-04" },
  { name: "Autumn Cashback Week", start: "2026-11-18", end: "2026-11-30" },
  { name: "Grand $100 000 Giveaway", start: "2026-12-18", end: "2027-01-18" },
  { name: "Anniversary Raffle", start: "2027-02-02", end: "2027-02-02" },
  { name: "Spring Promo Codes", start: "2027-02-14", end: "2027-02-28" },
];

export type InfoDoc = { title: string; body: string[]; bullets?: string[] };

export const INFO: Record<string, InfoDoc> = {
  terms: {
    title: "Terms of lending",
    body: [
      "Velox provides consumer loans from $2,000 to $100,000 for a term of 1 to 84 months. The interest rate is fixed for the entire term and the full cost of the loan is shown before you apply.",
      "Early repayment is free. Prolongation is available once per loan for up to 30 days.",
    ],
    bullets: [
      "Borrower age: 18–65 years.",
      "Valid ID and Tax ID number required.",
      "Money is transferred to a bank card in your name.",
      "14-day cooling-off period.",
    ],
  },
  about: {
    title: "About Velox",
    body: [
      "Velox Financial Technologies is a licensed digital lending platform serving more than 30,000 borrowers across Europe and North America.",
      "We combine automated underwriting with human support, so decisions are fast and every customer still has a real person to talk to.",
    ],
    bullets: ["Founded in 2019", "№5 top-rated digital financial platform", "8.1K+ clients served daily"],
  },
  certified: {
    title: "Fully Certified",
    body: [
      "We operate under official financial licenses and strict regulatory standards, ensuring 100% legal protection for every transaction and contract.",
      "Our licenses are audited annually and published in the Licenses section.",
    ],
  },
  smart: {
    title: "Smart Solutions",
    body: [
      "We utilize advanced automated algorithms to process your applications instantly. This eliminates traditional banking stress and guarantees quick funding.",
      "Scoring takes under 2 minutes and never affects your credit score until you accept an offer.",
    ],
  },
  scale: {
    title: "Proven Scale",
    body: [
      "We have grown into a leading digital credit network over years of market presence. Millions in securely processed loans confirm our top global reputation.",
    ],
  },
  examples: {
    title: "Calculation examples",
    body: [
      "Examples below use our standard rates without promo codes. The repayment amount includes interest and all service fees.",
    ],
  },
  events: {
    title: "Events",
    body: [
      "Loyalty events are open to every customer with at least one active or closed loan. Event dates are shown in the calendar.",
    ],
  },
  "event-terms": {
    title: "Event terms",
    body: [
      "Participation is free. One entry per customer per event. Winners are chosen randomly and notified by e-mail within 5 business days.",
    ],
  },
  gifts: {
    title: "Gifts",
    body: ["Gifts include fee waivers, cashback on repayments and partner vouchers. Gifts cannot be exchanged for cash."],
  },
  raffles: {
    title: "Raffles",
    body: ["Every on-time payment during an active raffle gives you one extra entry. The draw is held on the last day of the event."],
  },
  other: {
    title: "Other",
    body: ["For anything else, write to velox@gmail.com or call +1 (455) 294-56-18."],
  },
  consultation: {
    title: "Consultation",
    body: ["Book a free call with a credit specialist. We will help you choose a plan and explain every payment before you apply."],
  },
  prolongation: {
    title: "Prolongation",
    body: ["You can prolong a loan once for up to 30 days. Prolongation is requested from your account and approved instantly if there are no overdue payments."],
  },
  "early-repayment": {
    title: "Early repayment",
    body: ["Repay any amount at any time without penalties. Interest is recalculated from the day of your payment."],
  },
  licenses: {
    title: "Licenses",
    body: ["Velox Financial Technologies, Inc. holds consumer lending licenses in all jurisdictions where its services are offered."],
  },
  help: {
    title: "Help",
    body: ["Our help center covers applications, payments, documents and account security. Support is available 24/7."],
  },
  documents: {
    title: "All documents",
    body: ["Loan agreement template, general terms, privacy policy, complaints procedure and fee schedule are available on request."],
  },
  requirements: {
    title: "Borrower requirements",
    body: ["Review our simple criteria for applicants."],
    bullets: [
      "The applicant must be between 18 and 65 years old.",
      "You need to provide a valid ID and a Tax ID number.",
      "You can apply online without providing any proof of income.",
    ],
  },
  referral: {
    title: "Referral programs",
    body: ["Invite a friend and receive a $50 fee credit after their first on-time payment. There is no limit on the number of referrals."],
  },
  anniversaries: {
    title: "Anniversaries",
    body: ["Every year with Velox unlocks a lower rate and a surprise gift on your account anniversary."],
  },
  promo: {
    title: "Promo codes",
    body: ["Enter a promo code in the loan calculator to reduce service fees. Try VELOX10, WELCOME or LOYALTY."],
  },
  privacy: { title: "Privacy Policy", body: ["We process personal data only to provide lending services and never sell it to third parties."] },
  "terms-of-use": { title: "Terms of Use", body: ["By using this website you agree to the general terms of Velox Financial Technologies, Inc."] },
  licensee: { title: "Licensee Info", body: ["Velox Financial Technologies, Inc., licensed consumer lender."] },
  hipaa: { title: "HIPAA & Security", body: ["All data is encrypted in transit and at rest. We follow industry security standards and undergo regular audits."] },
};
