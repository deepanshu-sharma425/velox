# VELOX — Neobank & Digital Lending Platform

A modern, high-performance **Next.js** application featuring tactile 3D scroll-driven card unboxing animations, Lenis smooth scrolling, Framer Motion physics, an interactive loan calculator, global dynamic currency/banking store, and a dedicated **Alex Morgan Customer Dashboard**.

---

## 🌟 Key Features

### 1. ⚡ Live Reactive Banking Store & Global Currency Switching
- **Dynamic Multi-Currency System**: Select between `USD ($)`, `EUR (€)`, `GBP (£)`, and `ESP (€)` in the navbar. All figures across the Hero, Calculator, Plans, Dashboard (balance, debt, monthly due, loan schedules, transactions, statement export) recalculate dynamically in real-time.
- **Dynamic Loan Repayment**: Pay down active loans early with real-time balance deductions, debt reductions, credit score boosts, and ledger logs.
- **Dynamic Send Money**: Transfer funds instantly to external recipients with real-time ledger entries.
- **Dynamic Loan Underwriting**: Applying for loans instantly provisions new credit lines and disburses funds into the user's available balance and active loans list.
- **Dynamic Chart Data**: Interactive SVG trend chart recalculates and redraws for `1M`, `3M`, `6M`, and `1Y` intervals with live hover tooltips.
- **Dynamic Calendar**: Click any date in September 2026 to see the scheduled events, payments, and notes for that day.
- **Official Statement Export**: Generates and downloads a real formatted `.txt` statement file to the user's computer.

### 2. 🔤 Enlarged, Stylish & Sober Typography (Full-Page Presence)
- Base root font scaling increased to `19px` (and `20px` on ultra-wide screens), making the entire application feel full, prominent, legible, and rich.
- Massive, confident editorial display headings (`text-6xl sm:text-8xl md:text-9xl lg:text-[7.2rem] font-black`).
- Generous paragraph sizing (`text-base sm:text-lg md:text-xl font-normal`).
- Bold financial metric numerals (`text-4xl sm:text-5xl font-black font-mono`).

### 3. 💳 Tactile 3D Card Unboxing Scroll Experience
- **Outer Protective Sleeve**: The debit card starts securely housed inside an obsidian & titanium finished sleeve pocket with an embossed gold foil Velox emblem.
- **Scroll Unboxing**: As you scroll, the top magnetic seal flap swings open, and the physical **Velvet Orange Debit Card** slides out from inside the pocket.
- **Zoom & Isometric Rotation**: Once clear of the sleeve, the card smoothly zooms forward into center stage (`scale: 1.48`), settling into hero focus while the background sleeve blurs into depth-of-field (`blur(18px)`).
- **Interactive Controls**:
  - **3D Mouse Tilt**: Real-time cursor-following specular sheen & dynamic perspective tilt.
  - **180° Flip**: Flip the card to inspect the magnetic strip, CVV code, and authorized signature.
  - **Skin Switcher**: Toggle between *Velvet Orange*, *Obsidian Stealth*, and *Titanium Frost*.
  - **Freeze / Unfreeze**: Real-time frosted ice overlay locking card transactions (shared with Dashboard).
  - **Reveal Digits & Apple Wallet**: Show/hide card numbers and trigger confetti celebration on wallet add.

### 4. ☀️ Light Mode & Dark Mode Support
- Complete theme switcher in the Navbar and Dashboard with smooth transitions.
- **Light Mode**: Crisp alabaster background (`#F8F8F7`), dark slate text (`#111827`), translucent frosted glass pills, and delicate shadows.
- **Dark Mode**: Deep obsidian fintech aesthetic (`#080808`), glowing accents, and dark glass panels.
- Orangish ambient fluted rays are strictly isolated to the first home page view.

---

## 🚀 Running the Project

### Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.
To access the dashboard directly: **[http://localhost:3000/dashboard](http://localhost:3000/dashboard)**.

### Production Build
```bash
npm run build
npm run start
```
