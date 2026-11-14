/**
 * VELOX NEOBANK — CORE APPLICATION JAVASCRIPT
 * High performance, 60fps animations, interactive loan calculator,
 * 3D card tilt physics, modal managers, fluted rays canvas, and UI interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
  initFlutedCanvas();
  initStickyHeader();
  initNavScrollSpy();
  initLoanCalculator();
  initTestimonialsCarousel();
  init3DCardTilt();
  initStatsCounter();
  initModals();
  initForms();
  initToTop();
});

/* ==========================================================================
   1. FLUTED RAYS CANVAS RENDERER
   Generates radiant, pleated amber light rays reminiscent of 3D fluted panels
   ========================================================================== */
function initFlutedCanvas() {
  const canvas = document.getElementById('fluted-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let width, height;
  let animationFrameId;
  let time = 0;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function draw() {
    ctx.clearRect(0, 0, width, height);

    const centerX = width * 0.5;
    const centerY = height * 0.18; // Origin above the hero headline
    const numRays = 48;
    const baseRadius = Math.max(width, height) * 0.75;

    time += 0.006;

    for (let i = 0; i < numRays; i++) {
      const angle = (i / numRays) * Math.PI - (Math.PI * 0.5); // Radiate upwards/downwards
      const spread = angle * 0.9 + Math.sin(time + i * 0.15) * 0.015;
      
      const x1 = centerX + Math.sin(spread) * 80;
      const y1 = centerY - Math.cos(spread) * 80;
      const x2 = centerX + Math.sin(spread) * baseRadius;
      const y2 = centerY - Math.cos(spread) * baseRadius;

      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      const intensity = 0.06 + Math.sin(i * 0.4 + time) * 0.025;
      
      // Warm amber to deep burnt orange
      grad.addColorStop(0, `rgba(255, 130, 20, ${intensity * 1.5})`);
      grad.addColorStop(0.3, `rgba(255, 90, 0, ${intensity})`);
      grad.addColorStop(0.7, `rgba(160, 45, 0, ${intensity * 0.4})`);
      grad.addColorStop(1, 'rgba(8, 8, 8, 0)');

      ctx.beginPath();
      ctx.lineWidth = width > 768 ? 16 : 8;
      ctx.strokeStyle = grad;
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    animationFrameId = requestAnimationFrame(draw);
  }

  draw();
}

/* ==========================================================================
   2. STICKY HEADER & NAVBAR SCROLL SPY
   ========================================================================== */
function initStickyHeader() {
  const header = document.getElementById('header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });
}

function initNavScrollSpy() {
  const nav = document.getElementById('main-nav');
  const indicator = document.getElementById('nav-indicator');
  const links = document.querySelectorAll('.nav-link');
  if (!nav || !indicator || !links.length) return;

  function moveIndicator(targetEl) {
    if (!targetEl) return;
    const navRect = nav.getBoundingClientRect();
    const linkRect = targetEl.getBoundingClientRect();
    
    indicator.style.width = `${linkRect.width}px`;
    indicator.style.left = `${linkRect.left - navRect.left}px`;
  }

  // Set initial position on active link
  const initialActive = document.querySelector('.nav-link.active') || links[0];
  setTimeout(() => moveIndicator(initialActive), 100);

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      moveIndicator(link);
    });
  });

  // Observe section visibility
  const sections = document.querySelectorAll('section[id]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        const activeLink = document.querySelector(`.nav-link[href="#${id}"]`);
        if (activeLink) {
          links.forEach(l => l.classList.remove('active'));
          activeLink.classList.add('active');
          moveIndicator(activeLink);
        }
      }
    });
  }, { threshold: 0.35 });

  sections.forEach(sec => observer.observe(sec));
  window.addEventListener('resize', () => {
    const curr = document.querySelector('.nav-link.active');
    if (curr) moveIndicator(curr);
  });
}

/* ==========================================================================
   3. INTERACTIVE LOAN CALCULATOR
   Accurately computes monthly payment, interest, fees, first repayment date
   ========================================================================== */
function initLoanCalculator() {
  const principalSlider = document.getElementById('principal-slider');
  const termSlider = document.getElementById('term-slider');
  const displayPrincipal = document.getElementById('display-principal');
  const displayTerm = document.getElementById('display-term');

  // Breakdown fields
  const schedReturnLabel = document.getElementById('sched-return-label');
  const schedTotalRepayment = document.getElementById('sched-total-repayment');
  const schedFirstDate = document.getElementById('sched-first-date');
  const schedPrincipal = document.getElementById('sched-principal');
  const schedInterest = document.getElementById('sched-interest');
  const schedFees = document.getElementById('sched-fees');
  const schedMonthlyPayment = document.getElementById('sched-monthly-payment');
  const schedMonthlyRate = document.getElementById('sched-monthly-rate');

  // Summary fields
  const summaryTotal = document.getElementById('summary-total');
  const summaryInterest = document.getElementById('summary-interest');
  const summaryRepay = document.getElementById('summary-repay');
  const summaryTerm = document.getElementById('summary-term');

  // Promocode
  const promoInput = document.getElementById('promocode-input');
  const promoApplyBtn = document.getElementById('promo-apply-btn');
  const promoMsg = document.getElementById('promo-msg');
  let promoDiscount = 0; // percentage off fees

  if (!principalSlider || !termSlider) return;

  function updateSliderBackground(slider) {
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    const val = parseFloat(slider.value);
    const percentage = ((val - min) / (max - min)) * 100;
    slider.style.background = `linear-gradient(to right, #FF7A00 0%, #FF7A00 ${percentage}%, rgba(255, 255, 255, 0.1) ${percentage}%, rgba(255, 255, 255, 0.1) 100%)`;
  }

  function calculateLoan() {
    const principal = parseFloat(principalSlider.value);
    const term = parseInt(termSlider.value, 10);

    // Update displays
    displayPrincipal.textContent = principal.toLocaleString('en-US');
    displayTerm.textContent = term;

    // Monthly interest formula (behance: ~0.83% monthly base, lower for longer terms)
    const monthlyRate = 0.0083 * (1 - (term / 100) * 0.12);
    const totalInterest = Math.round(principal * monthlyRate * term);
    
    // Service fees (nominal origination charge)
    let serviceFees = Math.round(principal * 0.065 + 3500);
    if (promoDiscount > 0) {
      serviceFees = Math.round(serviceFees * (1 - promoDiscount));
    }

    const totalRepayment = principal + totalInterest + serviceFees;
    const monthlyPayment = (totalRepayment / term).toFixed(2);

    // Date computation (First payment exactly 30 days from now)
    const now = new Date();
    now.setDate(now.getDate() + 30);
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;

    // Populate schedule breakdown
    schedReturnLabel.textContent = `Return in ${term} months`;
    schedTotalRepayment.textContent = `$${totalRepayment.toLocaleString('en-US')}`;
    schedFirstDate.textContent = formattedDate;
    schedPrincipal.textContent = `$${principal.toLocaleString('en-US')}`;
    schedInterest.textContent = `$${totalInterest.toLocaleString('en-US')}`;
    schedFees.textContent = `$${serviceFees.toLocaleString('en-US')}`;
    schedMonthlyPayment.textContent = `$${parseFloat(monthlyPayment).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    schedMonthlyRate.textContent = `(${(monthlyRate * 100).toFixed(2).replace('.', ',')}% per month)`;

    // Populate summary totals
    summaryTotal.textContent = `$${principal.toLocaleString('en-US')} USD`;
    summaryInterest.textContent = `$${totalInterest.toLocaleString('en-US')}`;
    summaryRepay.textContent = `$${totalRepayment.toLocaleString('en-US')}`;
    summaryTerm.textContent = `${term} month`;

    updateSliderBackground(principalSlider);
    updateSliderBackground(termSlider);
  }

  principalSlider.addEventListener('input', calculateLoan);
  termSlider.addEventListener('input', calculateLoan);

  // Toggle Schedule Accordion
  const scheduleToggle = document.getElementById('schedule-toggle');
  const scheduleContent = document.getElementById('schedule-content');
  if (scheduleToggle && scheduleContent) {
    scheduleToggle.addEventListener('click', () => {
      const isExpanded = scheduleToggle.getAttribute('aria-expanded') === 'true';
      scheduleToggle.setAttribute('aria-expanded', !isExpanded);
      scheduleToggle.classList.toggle('collapsed');
      scheduleContent.style.display = isExpanded ? 'none' : 'flex';
    });
  }

  // Promocode handler
  if (promoApplyBtn && promoInput) {
    promoApplyBtn.addEventListener('click', () => {
      const code = promoInput.value.trim().toUpperCase();
      if (!code) {
        showPromoFeedback('Please enter a valid promocode', 'error');
        return;
      }
      if (code === 'VELOXPRO' || code === 'VIP2026' || code === 'ANGELINA') {
        promoDiscount = 0.5; // 50% off fees
        showPromoFeedback('Promocode applied! 50% discount on service fees applied.', 'success');
        calculateLoan();
      } else {
        showPromoFeedback('Invalid promocode. Try "VELOXPRO"', 'error');
      }
    });
  }

  function showPromoFeedback(text, type) {
    if (!promoMsg) return;
    promoMsg.textContent = text;
    promoMsg.className = `promo-msg ${type}`;
    setTimeout(() => {
      if (type === 'error') {
        promoMsg.textContent = '';
        promoMsg.className = 'promo-msg';
      }
    }, 4000);
  }

  // Connect Plan preset buttons to Calculator
  const planButtons = document.querySelectorAll('.select-plan-btn');
  planButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const presetAmount = btn.getAttribute('data-preset');
      const presetTerm = btn.getAttribute('data-term');
      if (presetAmount) principalSlider.value = presetAmount;
      if (presetTerm) termSlider.value = presetTerm;
      calculateLoan();

      // Smooth scroll to calculator
      const calcEl = document.getElementById('calculator');
      if (calcEl) {
        calcEl.scrollIntoView({ behavior: 'smooth' });
        calcEl.classList.add('flash-highlight');
        setTimeout(() => calcEl.classList.remove('flash-highlight'), 1200);
      }
      showToast(`Selected plan loaded into calculator: $${parseInt(presetAmount).toLocaleString()} for ${presetTerm} mo.`);
    });
  });

  // Initial calculation run
  calculateLoan();
}

/* ==========================================================================
   4. HERO TESTIMONIALS CAROUSEL
   ========================================================================== */
function initTestimonialsCarousel() {
  const track = document.getElementById('testimonials-track');
  const prevBtn = document.getElementById('testi-prev-btn');
  const nextBtn = document.getElementById('testi-next-btn');
  const cards = document.querySelectorAll('.testi-card');
  if (!track || !cards.length) return;

  let activeIndex = 1;

  function updateActiveCard(index) {
    cards.forEach((card, i) => {
      card.classList.toggle('active', i === index);
    });
    const targetCard = cards[index];
    if (targetCard) {
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      activeIndex = (activeIndex - 1 + cards.length) % cards.length;
      updateActiveCard(activeIndex);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      activeIndex = (activeIndex + 1) % cards.length;
      updateActiveCard(activeIndex);
    });
  }

  cards.forEach((card, index) => {
    card.addEventListener('click', () => {
      activeIndex = index;
      updateActiveCard(activeIndex);
    });
  });
}

/* ==========================================================================
   5. 3D DEBIT CARD INTERACTIVE TILT & MOUSE PHYSICS
   ========================================================================== */
function init3DCardTilt() {
  const card = document.getElementById('velox-card');
  const sheen = document.getElementById('card-sheen');
  const scene = document.getElementById('card-scene');
  if (!card || !scene) return;

  scene.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -16;
    const rotateY = ((x - centerX) / centerX) * 16;

    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.04, 1.04, 1.04)`;

    if (sheen) {
      const sheenX = (x / rect.width) * 100;
      const sheenY = (y / rect.height) * 100;
      sheen.style.background = `radial-gradient(circle at ${sheenX}% ${sheenY}%, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0) 65%)`;
      sheen.style.opacity = '0.6';
    }
  });

  scene.addEventListener('mouseleave', () => {
    card.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    if (sheen) {
      sheen.style.opacity = '0.3';
    }
  });
}

/* ==========================================================================
   6. STATS NUMBER COUNTER (INTERSECTION OBSERVER)
   ========================================================================== */
function initStatsCounter() {
  const stats = document.querySelectorAll('.stat-number');
  if (!stats.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseFloat(el.getAttribute('data-target'));
        const isDecimal = String(target).includes('.');
        const duration = 1800;
        const startTime = performance.now();

        function animateCount(now) {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easeOutProgress = 1 - Math.pow(1 - progress, 3);
          const current = target * easeOutProgress;

          el.textContent = isDecimal ? current.toFixed(1) : Math.floor(current);

          if (progress < 1) {
            requestAnimationFrame(animateCount);
          } else {
            el.textContent = target;
          }
        }

        requestAnimationFrame(animateCount);
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  stats.forEach(s => observer.observe(s));
}

/* ==========================================================================
   7. MODAL MANAGERS (DASHBOARD & AUTHENTICATION)
   ========================================================================== */
function initModals() {
  const dashModal = document.getElementById('dashboard-modal');
  const authModal = document.getElementById('auth-modal');
  const openAccountBtn = document.getElementById('open-account-btn');
  const footerOpenAccount = document.getElementById('footer-open-account');
  const heroPayBtn = document.getElementById('hero-pay-loan-btn');
  const calcSubmitBtn = document.getElementById('calc-submit-btn');

  // Dashboard modal openers
  [openAccountBtn, footerOpenAccount].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => openModal(dashModal));
    }
  });

  // Close dashboard
  const dashCloseBtn = document.getElementById('dash-close-btn');
  const dashCloseX = document.getElementById('dash-close-x');
  [dashCloseBtn, dashCloseX].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => closeModal(dashModal));
    }
  });

  // Auth modal openers
  if (heroPayBtn) {
    heroPayBtn.addEventListener('click', () => openModal(authModal));
  }
  if (calcSubmitBtn) {
    calcSubmitBtn.addEventListener('click', () => {
      openModal(authModal);
      showToast('Proceeding to verification for chosen credit schedule.');
    });
  }

  // Close auth
  const authCloseX = document.getElementById('auth-close-x');
  if (authCloseX) {
    authCloseX.addEventListener('click', () => closeModal(authModal));
  }

  // Backdrop click to close
  [dashModal, authModal].forEach(modal => {
    if (!modal) return;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });

  // ESC key listener
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal(dashModal);
      closeModal(authModal);
    }
  });

  function openModal(modal) {
    if (!modal) return;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Auth Tabs (Sign Up vs Sign In)
  const tabSignUp = document.getElementById('tab-signup');
  const tabSignIn = document.getElementById('tab-signin');
  const authHeading = document.getElementById('auth-title');
  const authNameGroup = document.getElementById('auth-name-group');
  const authPhoneGroup = document.getElementById('auth-phone-group');
  const authTermsGroup = document.getElementById('auth-terms-group');
  const authRememberGroup = document.getElementById('auth-remember-group');
  const authSubmitBtn = document.getElementById('auth-submit-btn');
  const passCriteria = document.getElementById('pass-criteria');

  if (tabSignUp && tabSignIn) {
    tabSignUp.addEventListener('click', () => {
      tabSignUp.classList.add('active');
      tabSignIn.classList.remove('active');
      authHeading.innerHTML = 'Get started in a few<br>simple steps';
      authNameGroup.classList.remove('d-none');
      authPhoneGroup.classList.remove('d-none');
      authTermsGroup.classList.remove('d-none');
      authRememberGroup.classList.add('d-none');
      passCriteria.classList.remove('d-none');
      authSubmitBtn.textContent = 'Sign me Up';
    });

    tabSignIn.addEventListener('click', () => {
      tabSignIn.classList.add('active');
      tabSignUp.classList.remove('active');
      authHeading.textContent = 'Welcome back!';
      authNameGroup.classList.add('d-none');
      authPhoneGroup.classList.add('d-none');
      authTermsGroup.classList.add('d-none');
      authRememberGroup.classList.remove('d-none');
      passCriteria.classList.add('d-none');
      authSubmitBtn.textContent = 'Continue';
    });
  }

  // Password validation indicators
  const authPassword = document.getElementById('auth-password');
  const critNumbers = document.getElementById('crit-numbers');
  const critLength = document.getElementById('crit-length');

  if (authPassword && critNumbers && critLength) {
    authPassword.addEventListener('input', () => {
      const val = authPassword.value;
      const hasNumber = /\d/.test(val);
      const isMin11 = val.length >= 11;

      critNumbers.classList.toggle('valid', hasNumber);
      critNumbers.querySelector('.crit-icon').textContent = hasNumber ? '✓' : '○';

      critLength.classList.toggle('valid', isMin11);
      critLength.querySelector('.crit-icon').textContent = isMin11 ? '✓' : '○';
    });
  }

  // Password eye toggle
  const togglePassBtn = document.getElementById('toggle-pass-visibility');
  if (togglePassBtn && authPassword) {
    togglePassBtn.addEventListener('click', () => {
      const isPass = authPassword.type === 'password';
      authPassword.type = isPass ? 'text' : 'password';
    });
  }

  // Copy User ID
  const copyBtn = document.getElementById('copy-user-id');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText('481024').then(() => {
        showToast('Client ID #481024 copied to clipboard');
      });
    });
  }

  // Download Statement Simulation
  const downloadBtn = document.getElementById('download-statement-btn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      showToast('Generating official encrypted PDF statement for Alex Morgan...');
      setTimeout(() => {
        showToast('✓ Statement_Sep_2026_Velox.pdf ready for download!');
      }, 1500);
    });
  }

  // Calendar Day Selection
  const calCells = document.querySelectorAll('.cal-cell:not(.muted)');
  calCells.forEach(cell => {
    cell.addEventListener('click', () => {
      calCells.forEach(c => c.classList.remove('current-day'));
      cell.classList.add('current-day');
      showToast(`Selected date: Sep ${cell.textContent}, 2026 — Zero scheduled payment penalties.`);
    });
  });

  // Language Menu Dropdown
  const langBtn = document.getElementById('lang-btn');
  const langWrapper = langBtn?.closest('.dropdown-wrapper');
  const langItems = document.querySelectorAll('.dropdown-item');
  const currentLangText = document.getElementById('current-lang');

  if (langBtn && langWrapper) {
    langBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      langWrapper.classList.toggle('open');
    });

    document.addEventListener('click', () => {
      langWrapper.classList.remove('open');
    });

    langItems.forEach(item => {
      item.addEventListener('click', () => {
        const lang = item.getAttribute('data-lang');
        if (currentLangText) currentLangText.textContent = lang;
        langItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        langWrapper.classList.remove('open');
        showToast(`Language set to ${item.textContent}`);
      });
    });
  }
}

/* ==========================================================================
   8. FORMS & VALIDATION (BOOKING & NEWSLETTER)
   ========================================================================== */
function initForms() {
  const bookingForm = document.getElementById('booking-form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('book-name');
      const phoneInput = document.getElementById('book-phone');
      
      if (!nameInput.value.trim() || !phoneInput.value.trim()) {
        showToast('Please provide your name and phone number to book a call.', 'error');
        return;
      }

      showToast(`Thanks ${nameInput.value.trim()}! A Velox credit specialist will call you shortly.`);
      bookingForm.reset();
    });
  }

  const newsletterForm = document.getElementById('newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('footer-email');
      if (!emailInput.value.trim() || !emailInput.checkValidity()) {
        showToast('Please enter a valid email address.', 'error');
        return;
      }
      showToast('✓ Subscribed! You will receive drop alerts on new credit rates.');
      newsletterForm.reset();
    });
  }

  const authForm = document.getElementById('auth-form');
  if (authForm) {
    authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('auth-email').value;
      showToast(`Welcome! Authenticated as ${email}. Synchronizing dashboard...`);
      setTimeout(() => {
        const authModal = document.getElementById('auth-modal');
        const dashModal = document.getElementById('dashboard-modal');
        if (authModal) authModal.classList.remove('open');
        if (dashModal) dashModal.classList.add('open');
      }, 1000);
    });
  }
}

/* ==========================================================================
   9. SCROLL TO TOP UTILITY
   ========================================================================== */
function initToTop() {
  const toTopBtn = document.getElementById('scroll-to-top');
  if (toTopBtn) {
    toTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

/* ==========================================================================
   10. TOAST NOTIFICATION UTILITY
   ========================================================================== */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'velox-toast';
  
  const icon = type === 'error' ? '⚠️' : '✨';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 350);
  }, 4000);
}
