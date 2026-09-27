```javascript
/* ==========================================================================
   WEDORA – WEDDING PLANNER
   Production-Ready Vanilla JavaScript
   Frontend-only prototype (no backend)
   ========================================================================== */

(function () {
  'use strict';

  /* ==========================================================================
     1. CONFIGURATION
     ========================================================================== */
  const STORAGE_PREFIX = 'wedora_';

  const STORAGE_KEYS = {
    USER: STORAGE_PREFIX + 'user',
    WEDDING: STORAGE_PREFIX + 'wedding',
    GUESTS: STORAGE_PREFIX + 'guests',
    CHECKLIST: STORAGE_PREFIX + 'checklist',
    BUDGET: STORAGE_PREFIX + 'budget',
    CATERING: STORAGE_PREFIX + 'catering'
  };

  const DEFAULT_WEDDING_DATE = '2026-12-20T16:00:00';

  const countdownIntervals = {};

  /* ==========================================================================
     2. UTILITY FUNCTIONS
     ========================================================================== */
  function qs(selector, ctx) {
    try {
      return (ctx || document).querySelector(selector);
    } catch (e) {
      return null;
    }
  }

  function qsa(selector, ctx) {
    try {
      return Array.prototype.slice.call((ctx || document).querySelectorAll(selector));
    } catch (e) {
      return [];
    }
  }

  function firstExisting(selectors) {
    for (let i = 0; i < selectors.length; i++) {
      const el = qs(selectors[i]);
      if (el) return el;
    }
    return null;
  }

  function firstExistingAll(selectors) {
    for (let i = 0; i < selectors.length; i++) {
      const els = qsa(selectors[i]);
      if (els.length) return els;
    }
    return [];
  }

  function isValidEmail(value) {
    if (typeof value !== 'string') return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  function isValidPhone(value) {
    if (typeof value !== 'string') return false;
    const digits = value.replace(/\D/g, '');
    return digits.length >= 7 && digits.length <= 15;
  }

  function isValidIndianMobile(value) {
    if (typeof value !== 'string') return false;
    const digits = value.replace(/\D/g, '');
    return digits.length === 10 || (digits.length === 12 && digits.indexOf('91') === 0);
  }

  function formatINR(num) {
    const n = Number(num) || 0;
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(n);
    } catch (e) {
      return '₹' + n.toFixed(0);
    }
  }

  function debounce(fn, delay) {
    let timer = null;
    return function () {
      const args = arguments;
      const ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(ctx, args);
      }, delay);
    };
  }

  function setError(input, message) {
    if (!input) return;
    input.classList.add('error');
    const parent = input.parentElement;
    if (!parent) return;

    let errorEl = parent.querySelector('.error-message');
    if (!errorEl) {
      errorEl = document.createElement('span');
      errorEl.className = 'error-message';
      errorEl.style.color = '#b33b3b';
      errorEl.style.fontSize = '0.8rem';
      errorEl.style.marginTop = '4px';
      errorEl.style.display = 'block';
      parent.appendChild(errorEl);
    }
    errorEl.textContent = message;
  }

  function clearError(input) {
    if (!input) return;
    input.classList.remove('error');
    const parent = input.parentElement;
    if (!parent) return;
    const errorEl = parent.querySelector('.error-message');
    if (errorEl) errorEl.remove();
  }

  function clearAllErrors(form) {
    if (!form) return;
    qsa('input, textarea, select', form).forEach(clearError);
  }

  /* ==========================================================================
     3. LOCAL STORAGE HELPERS
     ========================================================================== */
  function saveData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  function loadData(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function removeData(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      /* silent */
    }
  }

  function clearWedoraData() {
    Object.keys(STORAGE_KEYS).forEach(function (k) {
      removeData(STORAGE_KEYS[k]);
    });
  }

  /* ==========================================================================
     4. TOAST SYSTEM
     ========================================================================== */
  let toastContainerEl = null;

  function ensureToastContainer() {
    if (toastContainerEl && document.body.contains(toastContainerEl)) {
      return toastContainerEl;
    }

    toastContainerEl = qs('#toastContainer') || qs('.toast-container');

    if (!toastContainerEl) {
      toastContainerEl = document.createElement('div');
      toastContainerEl.id = 'toastContainer';
      toastContainerEl.className = 'toast-container';
      toastContainerEl.style.position = 'fixed';
      toastContainerEl.style.top = '96px';
      toastContainerEl.style.right = '24px';
      toastContainerEl.style.zIndex = '9999';
      toastContainerEl.style.display = 'flex';
      toastContainerEl.style.flexDirection = 'column';
      toastContainerEl.style.gap = '12px';
      toastContainerEl.style.maxWidth = '360px';
      toastContainerEl.style.pointerEvents = 'none';
      document.body.appendChild(toastContainerEl);
    }

    return toastContainerEl;
  }

  function showToast(message, type) {
    try {
      const container = ensureToastContainer();
      if (!container) return;

      const validTypes = ['success', 'error', 'warning', 'info'];
      const toastType = validTypes.indexOf(type) !== -1 ? type : 'info';

      const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
      };

      const toast = document.createElement('div');
      toast.className = 'toast toast-' + toastType;
      toast.style.pointerEvents = 'auto';
      toast.style.background = '#ffffff';
      toast.style.borderRadius = '16px';
      toast.style.boxShadow = '0 16px 40px rgba(0,0,0,0.12)';
      toast.style.padding = '14px 20px';
      toast.style.display = 'flex';
      toast.style.alignItems = 'center';
      toast.style.gap = '12px';
      toast.style.fontSize = '0.92rem';
      toast.style.fontWeight = '500';
      toast.style.color = '#2e2e2e';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(40px)';
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

      const borderColors = {
        success: '#1e7b4a',
        error: '#b33b3b',
        warning: '#b16d00',
        info: '#2563eb'
      };
      toast.style.borderLeft = '5px solid ' + (borderColors[toastType] || borderColors.info);

      const iconEl = document.createElement('i');
      iconEl.className = 'fas ' + (icons[toastType] || icons.info);
      iconEl.style.color = borderColors[toastType] || borderColors.info;
      iconEl.style.fontSize = '1.2rem';
      iconEl.style.flexShrink = '0';

      const textEl = document.createElement('span');
      textEl.textContent = message == null ? '' : String(message);

      toast.appendChild(iconEl);
      toast.appendChild(textEl);
      container.appendChild(toast);

      // Animate in
      requestAnimationFrame(function () {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
      });

      // Animate out and remove
      setTimeout(function () {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(40px)';
        setTimeout(function () {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 350);
      }, 4000);
    } catch (e) {
      /* silent */
    }
  }

  /* ==========================================================================
     5. MODAL SYSTEM
     ========================================================================== */
  let activeModalEl = null;
  let lastFocusedEl = null;

  function openModal(modal) {
    if (!modal) return;
    try {
      lastFocusedEl = document.activeElement;
      modal.classList.add('active');
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      activeModalEl = modal;

      const focusTarget = modal.querySelector('input, button, select, textarea');
      if (focusTarget && typeof focusTarget.focus === 'function') {
        setTimeout(function () {
          try { focusTarget.focus(); } catch (e) { /* silent */ }
        }, 80);
      }
    } catch (e) {
      /* silent */
    }
  }

  function closeModal(modal) {
    if (!modal) return;
    try {
      modal.classList.remove('active');
      modal.style.display = 'none';
      if (activeModalEl === modal) activeModalEl = null;

      if (!qs('.modal-overlay.active')) {
        document.body.style.overflow = '';
      }

      if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') {
        try { lastFocusedEl.focus(); } catch (e) { /* silent */ }
        lastFocusedEl = null;
      }
    } catch (e) {
      /* silent */
    }
  }

  function closeAllModals() {
    qsa('.modal-overlay').forEach(function (m) {
      if (m.classList.contains('active')) closeModal(m);
    });
    document.body.style.overflow = '';
    activeModalEl = null;
  }

  /* ==========================================================================
     6. NAVIGATION
     ========================================================================== */
  function initMobileNav() {
    const menuBtn = firstExisting([
      '.menu-btn',
      '.menu-toggle',
      '#menuBtn',
      '#hamburgerBtn',
      '.hamburger'
    ]);

    const nav = firstExisting([
      '.nav-links',
      '#navLinks',
      '.mobile-menu'
    ]);

    if (!menuBtn || !nav) return;

    menuBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      nav.classList.toggle('open');
      menuBtn.classList.toggle('active');
    });

    qsa('a', nav).forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
        menuBtn.classList.remove('active');
      });
    });

    document.addEventListener('click', function (e) {
      if (
        nav.classList.contains('open') &&
        !nav.contains(e.target) &&
        !menuBtn.contains(e.target)
      ) {
        nav.classList.remove('open');
        menuBtn.classList.remove('active');
      }
    });
  }

  function initSmoothScroll() {
    qsa('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (!href || href === '#' || href.length < 2) return;

        let target = null;
        try {
          target = document.querySelector(href);
        } catch (err) {
          target = null;
        }
        if (!target) return;

        e.preventDefault();
        const navbar = qs('.navbar');
        const offset = navbar ? navbar.offsetHeight : 80;
        const top = target.getBoundingClientRect().top + window.pageYOffset - offset + 2;

        try {
          window.scrollTo({ top: top, behavior: 'smooth' });
        } catch (err) {
          window.scrollTo(0, top);
        }
      });
    });
  }

  function initActiveNav() {
    if (typeof IntersectionObserver === 'undefined') return;

    const sections = qsa('section[id]');
    if (!sections.length) return;

    const navLinks = qsa('.nav-links a, #navLinks a');
    if (!navLinks.length) return;

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            navLinks.forEach(function (link) {
              const href = link.getAttribute('href');
              link.classList.toggle('active', href === '#' + id);
            });
          }
        });
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  /* ==========================================================================
     7. LOGIN
     ========================================================================== */
  function initLogin() {
    const loginBtn = firstExisting([
      '.login-btn',
      '.login-button',
      '[data-modal="login"]',
      '#loginBtn'
    ]);

    const loginModal = firstExisting([
      '#loginModal',
      '.login-modal',
      '[data-modal-content="login"]'
    ]);

    if (loginModal && !loginModal.classList.contains('modal-overlay')) {
      loginModal.classList.add('modal-overlay');
    }
    if (loginModal && loginModal.style.display === '') {
      loginModal.style.display = 'none';
    }

    if (loginBtn && loginModal) {
      loginBtn.addEventListener('click', function () {
        openModal(loginModal);
      });
    }

    if (loginModal) {
      const closeBtns = qsa('.close-btn, .modal-close', loginModal);
      closeBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          closeModal(loginModal);
        });
      });

      loginModal.addEventListener('click', function (e) {
        if (e.target === loginModal) closeModal(loginModal);
      });
    }

    const loginForm = firstExisting(['#loginForm', '.login-form', 'form[data-form="login"]']);
    if (!loginForm) return;

    qsa('input', loginForm).forEach(function (input) {
      input.addEventListener('input', function () { clearError(input); });
    });

    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clearAllErrors(loginForm);

      const emailInput = loginForm.querySelector('input[type="email"], #loginEmail');
      const passInput = loginForm.querySelector('input[type="password"], #loginPassword');

      let valid = true;

      if (emailInput) {
        const emailVal = emailInput.value.trim();
        if (!emailVal) {
          setError(emailInput, 'Email is required');
          valid = false;
        } else if (!isValidEmail(emailVal)) {
          setError(emailInput, 'Please enter a valid email');
          valid = false;
        }
      } else {
        valid = false;
      }

      if (passInput) {
        const passVal = passInput.value;
        if (!passVal) {
          setError(passInput, 'Password is required');
          valid = false;
        } else if (passVal.length < 6) {
          setError(passInput, 'Password must be at least 6 characters');
          valid = false;
        }
      } else {
        valid = false;
      }

      if (!valid) {
        showToast('Please fix the errors above', 'error');
        return;
      }

      const email = emailInput ? emailInput.value.trim() : '';
      saveData(STORAGE_KEYS.USER, { email: email, loggedIn: true });

      showToast('Login successful! Welcome back ❤️', 'success');

      if (loginModal) closeModal(loginModal);
      loginForm.reset();
    });
  }

  /* ==========================================================================
     8. REGISTER
     ========================================================================== */
  function initRegister() {
    const signupBtns = [
      '.signup-btn',
      '.register-btn',
      '[data-modal="signup"]',
      '#getStartedBtn',
      '#startPlanningBtn'
    ];

    const registerModal = firstExisting([
      '#signupModal',
      '.signup-modal',
      '.register-modal',
      '#registerModal',
      '[data-modal-content="signup"]'
    ]);

    if (registerModal && !registerModal.classList.contains('modal-overlay')) {
      registerModal.classList.add('modal-overlay');
    }
    if (registerModal && registerModal.style.display === '') {
      registerModal.style.display = 'none';
    }

    signupBtns.forEach(function (sel) {
      const btn = qs(sel);
      if (btn && registerModal) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          openModal(registerModal);
        });
      }
    });

    if (registerModal) {
      const closeBtns = qsa('.close-btn, .modal-close', registerModal);
      closeBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          closeModal(registerModal);
        });
      });

      registerModal.addEventListener('click', function (e) {
        if (e.target === registerModal) closeModal(registerModal);
      });
    }

    const registerForm = firstExisting([
      '#registerForm',
      '.register-form',
      '.signup-form',
      'form[data-form="register"]'
    ]);
    if (!registerForm) return;

    qsa('input', registerForm).forEach(function (input) {
      input.addEventListener('input', function () { clearError(input); });
    });

    registerForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clearAllErrors(registerForm);

      const nameInput = registerForm.querySelector('input[name="name"], #regName, input[type="text"]');
      const emailInput = registerForm.querySelector('input[type="email"], #regEmail');
      const mobileInput = registerForm.querySelector('input[type="tel"], #regMobile');
      const passInputs = qsa('input[type="password"]', registerForm);
      const passInput = passInputs[0] || null;
      const confirmInput = passInputs[1] || null;

      let valid = true;

      if (nameInput) {
        if (!nameInput.value.trim()) {
          setError(nameInput, 'Full name is required');
          valid = false;
        }
      } else { valid = false; }

      if (emailInput) {
        const ev = emailInput.value.trim();
        if (!ev) {
          setError(emailInput, 'Email is required');
          valid = false;
        } else if (!isValidEmail(ev)) {
          setError(emailInput, 'Please enter a valid email');
          valid = false;
        }
      } else { valid = false; }

      if (mobileInput) {
        const mv = mobileInput.value.trim();
        if (!mv) {
          setError(mobileInput, 'Mobile number is required');
          valid = false;
        } else if (!isValidIndianMobile(mv) && !isValidPhone(mv)) {
          setError(mobileInput, 'Please enter a valid mobile number');
          valid = false;
        }
      } else { valid = false; }

      if (passInput) {
        const pv = passInput.value;
        if (!pv) {
          setError(passInput, 'Password is required');
          valid = false;
        } else if (pv.length < 6) {
          setError(passInput, 'Password must be at least 6 characters');
          valid = false;
        }
      } else { valid = false; }

      if (confirmInput && passInput) {
        if (!confirmInput.value) {
          setError(confirmInput, 'Please confirm your password');
          valid = false;
        } else if (confirmInput.value !== passInput.value) {
          setError(confirmInput, 'Passwords do not match');
          valid = false;
        }
      }

      if (!valid) {
        showToast('Please fix the errors above', 'error');
        return;
      }

      const userData = {
        name: nameInput ? nameInput.value.trim() : '',
        email: emailInput ? emailInput.value.trim() : '',
        mobile: mobileInput ? mobileInput.value.trim() : '',
        registered: true,
        registeredAt: new Date().toISOString()
      };
      saveData(STORAGE_KEYS.USER, userData);

      showToast('Account created successfully! 💍', 'success');

      if (registerModal) closeModal(registerModal);
      registerForm.reset();
    });
  }

  /* ==========================================================================
     9. CONTACT FORM
     ========================================================================== */
  function initContactForm() {
    const form = firstExisting([
      '.contact-form',
      '#contactForm',
      'form[data-form="contact"]'
    ]);
    if (!form) return;

    const dateInput = form.querySelector('input[type="date"], #contactDate');
    if (dateInput) {
      try {
        const today = new Date();
        const iso = today.toISOString().split('T')[0];
        dateInput.setAttribute('min', iso);
      } catch (e) { /* silent */ }
    }

    qsa('input, textarea', form).forEach(function (input) {
      input.addEventListener('input', function () { clearError(input); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearAllErrors(form);

      const nameInput = form.querySelector('input[name="name"], #contactName, input[type="text"]');
      const emailInput = form.querySelector('input[type="email"], #contactEmail');
      const phoneInput = form.querySelector('input[type="tel"], #contactPhone');
      const messageInput = form.querySelector('textarea, #contactMessage');

      let valid = true;

      if (nameInput) {
        if (!nameInput.value.trim()) { setError(nameInput, 'Name is required'); valid = false; }
      } else { valid = false; }

      if (emailInput) {
        const ev = emailInput.value.trim();
        if (!ev) { setError(emailInput, 'Email is required'); valid = false; }
        else if (!isValidEmail(ev)) { setError(emailInput, 'Please enter a valid email'); valid = false; }
      } else { valid = false; }

      if (phoneInput) {
        const pv = phoneInput.value.trim();
        if (!pv) { setError(phoneInput, 'Phone is required'); valid = false; }
        else if (!isValidPhone(pv)) { setError(phoneInput, 'Please enter a valid phone number'); valid = false; }
      }

      if (messageInput) {
        const mv = messageInput.value.trim();
        if (!mv) { setError(messageInput, 'Message is required'); valid = false; }
        else if (mv.length < 10) { setError(messageInput, 'Message must be at least 10 characters'); valid = false; }
      }

      if (!valid) {
        showToast('Please fix the errors above', 'error');
        return;
      }

      showToast("Thank you! We'll contact you soon ❤️", 'success');
      form.reset();
    });
  }

  /* ==========================================================================
     10. CHECKLIST
     ========================================================================== */
  function initChecklist() {
    const items = firstExistingAll([
      '.checklist-item',
      '.task-item',
      '[data-task]'
    ]);
    if (!items.length) return;

    function recalc() {
      const allItems = firstExistingAll([
        '.checklist-item',
        '.task-item',
        '[data-task]'
      ]);
      const total = allItems.length;
      let completed = 0;

      allItems.forEach(function (item) {
        const cb = item.querySelector('input[type="checkbox"]');
        if (cb && cb.checked) completed++;
      });

      const percent = total ? Math.round((completed / total) * 100) : 0;

      qsa('.progress-fill, .checklist-progress, [data-progress]').forEach(function (el) {
        el.style.width = percent + '%';
      });

      qsa('.progress-text, [data-progress-text]').forEach(function (el) {
        el.textContent = completed + ' of ' + total + ' tasks completed';
      });

      const header = qs('.checklist-progress .progress-header span:first-child');
      if (header) header.textContent = completed + ' of ' + total + ' tasks completed';

      const pct = qs('#checklistPercentage');
      if (pct) pct.textContent = percent + '%';

      const bar = qs('#checklistProgressBar');
      if (bar) bar.style.width = percent + '%';
    }

    items.forEach(function (item) {
      const cb = item.querySelector('input[type="checkbox"]');
      if (!cb) return;

      item.classList.toggle('completed', cb.checked);

      cb.addEventListener('change', function () {
        item.classList.toggle('completed', cb.checked);
        recalc();
      });
    });

    recalc();
  }

  /* ==========================================================================
     11. BUDGET CALCULATOR
     ========================================================================== */
  function initBudget() {
    const totalInput = firstExisting(['#totalBudget', '#budgetInput']);
    const spentInput = firstExisting(['#totalSpent', '#expenseInput']);
    const displayTotal = firstExisting(['#displayTotalBudget', '[data-budget-total]']);
    const displaySpent = firstExisting(['#displayTotalSpent', '[data-budget-spent]']);
    const displayRemaining = firstExisting(['#displayRemaining', '[data-budget-remaining]']);

    if (!totalInput && !spentInput && !displayTotal && !displaySpent && !displayRemaining) {
      return;
    }

    function calc() {
      const total = totalInput ? parseFloat(totalInput.value) || 0 : 0;
      const spent = spentInput ? parseFloat(spentInput.value) || 0 : 0;
      const remaining = total - spent;

      if (displayTotal) displayTotal.textContent = formatINR(total);
      if (displaySpent) displaySpent.textContent = formatINR(spent);
      if (displayRemaining) displayRemaining.textContent = formatINR(remaining);

      if (remaining < 0) {
        showToast('Warning: You have exceeded your wedding budget!', 'warning');
      }

      saveData(STORAGE_KEYS.BUDGET, { total: total, spent: spent, remaining: remaining });
    }

    if (totalInput) totalInput.addEventListener('input', calc);
    if (spentInput) spentInput.addEventListener('input', calc);

    const saved = loadData(STORAGE_KEYS.BUDGET, null);
    if (saved) {
      if (totalInput && saved.total != null) totalInput.value = saved.total;
      if (spentInput && saved.spent != null) spentInput.value = saved.spent;
    }

    calc();
  }

  /* ==========================================================================
     12. CATERING CALCULATOR
     ========================================================================== */
  function initCatering() {
    const guestInput = firstExisting(['#guestCount', '#cateringGuests', '#numGuests']);
    const priceInput = firstExisting(['#pricePerPlate', '#perPlate', '#cateringPrice']);
    const calcBtn = firstExisting(['#calculateCatering', '#calcCateringBtn', '[data-catering-calc]']);
    const resultEl = firstExisting(['#cateringTotal', '#cateringResult', '[data-catering-total]']);

    if (!guestInput && !priceInput && !resultEl) return;

    function calc() {
      const guests = guestInput ? parseFloat(guestInput.value) || 0 : 0;
      const price = priceInput ? parseFloat(priceInput.value) || 0 : 0;

      if (guests <= 0) {
        showToast('Please enter a valid number of guests', 'warning');
        return;
      }
      if (price <= 0) {
        showToast('Please enter a valid per plate price', 'warning');
        return;
      }

      const total = guests * price;
      if (resultEl) resultEl.textContent = formatINR(total);

      saveData(STORAGE_KEYS.CATERING, { guests: guests, perPlate: price, total: total });
      showToast('Catering cost: ' + formatINR(total), 'success');
    }

    if (calcBtn) {
      calcBtn.addEventListener('click', calc);
    } else if (guestInput && priceInput) {
      // Auto-calc on input change if no button
      guestInput.addEventListener('input', calc);
      priceInput.addEventListener('input', calc);
    }

    const saved = loadData(STORAGE_KEYS.CATERING, null);
    if (saved) {
      if (guestInput && saved.guests != null) guestInput.value = saved.guests;
      if (priceInput && saved.perPlate != null) priceInput.value = saved.perPlate;
      if (resultEl && saved.total != null) resultEl.textContent = formatINR(saved.total);
    } else if (guestInput && priceInput && resultEl) {
      const g = parseFloat(guestInput.value) || 0;
      const p = parseFloat(priceInput.value) || 0;
      if (g && p) resultEl.textContent = formatINR(g * p);
    }
  }

  /* ==========================================================================
     13. GUEST MANAGEMENT
     ========================================================================== */
  function initGuests() {
    const form = firstExisting(['#guestForm', '.guest-form', 'form[data-form="guest"]']);
    const tableBody = qs('.guest-table-wrapper tbody') || qs('#guestTableBody');
    const statsEls = qsa('.guest-stat h3');

    if (!form && !tableBody && !statsEls.length) return;

    let guests = loadData(STORAGE_KEYS.GUESTS, null);
    if (!Array.isArray(guests)) {
      guests = [
        { name: 'Ananya Sharma', relation: "Bride's Sister", guests: 2, rsvp: 'Attending' },
        { name: 'Vikram Singh', relation: "Groom's Friend", guests: 1, rsvp: 'Pending' },
        { name: 'Meera Kapoor', relation: 'Cousin', guests: 3, rsvp: 'Attending' },
        { name: 'Rohan Verma', relation: 'Colleague', guests: 2, rsvp: 'Not Attending' },
        { name: 'Ishita Rao', relation: 'Friend', guests: 1, rsvp: 'Attending' }
      ];
    }

    function render() {
      // Stats
      let totalGuests = 0, attending = 0, notAttending = 0, pending = 0;
      guests.forEach(function (g) {
        const n = parseInt(g.guests, 10) || 0;
        totalGuests += n;
        if (g.rsvp === 'Attending') attending += n;
        else if (g.rsvp === 'Not Attending') notAttending += n;
        else pending += n;
      });

      if (statsEls[0]) statsEls[0].textContent = totalGuests;
      if (statsEls[1]) { statsEls[1].textContent = attending; statsEls[1].style.color = '#1e7b4a'; }
      if (statsEls[2]) { statsEls[2].textContent = notAttending; statsEls[2].style.color = '#b33b3b'; }
      if (statsEls[3]) { statsEls[3].textContent = pending; statsEls[3].style.color = '#b16d00'; }

      // Table
      if (!tableBody) return;
      tableBody.innerHTML = '';

      guests.forEach(function (guest, idx) {
        const tr = document.createElement('tr');

        const tdName = document.createElement('td');
        tdName.textContent = guest.name || '';

        const tdRel = document.createElement('td');
        tdRel.textContent = guest.relation || '';

        const tdGuests = document.createElement('td');
        tdGuests.textContent = guest.guests || 0;

        const tdRsvp = document.createElement('td');
        const badge = document.createElement('span');
        let badgeClass = 'badge-warning';
        if (guest.rsvp === 'Attending') badgeClass = 'badge-success';
        else if (guest.rsvp === 'Not Attending') badgeClass = 'badge-danger';
        badge.className = 'badge ' + badgeClass;
        badge.textContent = guest.rsvp || 'Pending';
        tdRsvp.appendChild(badge);

        const tdAction = document.createElement('td');
        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'btn btn-soft btn-sm';
        delBtn.textContent = 'Delete';
        delBtn.dataset.index = idx;
        delBtn.addEventListener('click', function () {
          const i = parseInt(this.dataset.index, 10);
          if (isNaN(i)) return;
          guests.splice(i, 1);
          saveData(STORAGE_KEYS.GUESTS, guests);
          render();
          showToast('Guest removed', 'info');
        });
        tdAction.appendChild(delBtn);

        tr.appendChild(tdName);
        tr.appendChild(tdRel);
        tr.appendChild(tdGuests);
        tr.appendChild(tdRsvp);
        tr.appendChild(tdAction);
        tableBody.appendChild(tr);
      });
    }

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        clearAllErrors(form);

        const nameEl = form.querySelector('input[name="name"], #guestName, input[type="text"]');
        const relEl = form.querySelector('input[name="relation"], #guestRelation');
        const numEl = form.querySelector('input[name="guests"], #guestCount, input[type="number"]');
        const rsvpEl = form.querySelector('select[name="rsvp"], #guestRsvp');

        let valid = true;

        if (nameEl && !nameEl.value.trim()) { setError(nameEl, 'Name is required'); valid = false; }
        if (!valid) { showToast('Please fix the errors above', 'error'); return; }

        const newGuest = {
          name: nameEl ? nameEl.value.trim() : '',
          relation: relEl ? relEl.value.trim() : '',
          guests: numEl ? parseInt(numEl.value, 10) || 1 : 1,
          rsvp: rsvpEl ? rsvpEl.value : 'Pending'
        };

        guests.push(newGuest);
        saveData(STORAGE_KEYS.GUESTS, guests);
        render();
        showToast('Guest added successfully', 'success');
        form.reset();
      });
    }

    render();
  }

  /* ==========================================================================
     14. VENDORS (SEARCH + FILTER)
     ========================================================================== */
  function initVendors() {
    const cards = firstExistingAll(['.vendor-card', '[data-vendor]']);
    const searchInput = firstExisting(['#vendorSearch', '.vendor-search input', '[data-vendor-search]']);
    const filterButtons = qsa('[data-vendor-filter], [data-category]');

    if (!cards.length) return;

    let activeCategory = 'All';

    function applyFilters() {
      const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
      let visible = 0;

      cards.forEach(function (card) {
        const text = (card.textContent || '').toLowerCase();
        const cardCategory =
          card.dataset.category ||
          (card.querySelector('.vendor-category') ? card.querySelector('.vendor-category').textContent.trim() : '');

        const matchesCategory = activeCategory === 'All' || cardCategory === activeCategory;
        const matchesQuery = !query || text.indexOf(query) !== -1;

        if (matchesCategory && matchesQuery) {
          card.style.display = '';
          visible++;
        } else {
          card.style.display = 'none';
        }
      });

      const noResults = qs('#noVendorsMessage');
      if (noResults) {
        noResults.style.display = visible === 0 ? 'block' : 'none';
      }
    }

    if (searchInput) {
      searchInput.addEventListener('input', debounce(applyFilters, 150));
    }

    if (filterButtons.length) {
      filterButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          filterButtons.forEach(function (b) {
            b.classList.remove('active');
          });
          btn.classList.add('active');
          activeCategory = btn.dataset.vendorFilter || btn.dataset.category || 'All';
          applyFilters();
        });
      });
    }

    applyFilters();
  }

  /* ==========================================================================
     15. WEDDING COUNTDOWN
     ========================================================================== */
  function initCountdown() {
    const el = firstExisting(['#weddingCountdown', '.countdown-box', '[data-countdown]']);
    if (!el) return;

    const KEY = 'weddingCountdown';
    if (countdownIntervals[KEY]) {
      clearInterval(countdownIntervals[KEY]);
      countdownIntervals[KEY] = null;
    }

    const saved = loadData(STORAGE_KEYS.WEDDING, null);
    let dateStr = (saved && saved.date) || DEFAULT_WEDDING_DATE;

    const dateAttr = el.dataset.weddingDate;
    if (dateAttr) dateStr = dateAttr;

    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return;

    function update() {
      const now = new Date();
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        el.textContent = 'Your special day has arrived! ❤️';
        if (countdownIntervals[KEY]) {
          clearInterval(countdownIntervals[KEY]);
          countdownIntervals[KEY] = null;
        }
        return;
      }

      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      el.textContent = days + 'd ' + hours + 'h ' + minutes + 'm ' + seconds + 's';
    }

    update();
    countdownIntervals[KEY] = setInterval(update, 1000);
  }

  /* ==========================================================================
     16. PASSWORD TOGGLE
     ========================================================================== */
  function initPasswordToggle() {
    const toggles = qsa('[data-password-toggle]');
    if (!toggles.length) return;

    toggles.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const targetId = btn.dataset.passwordToggle;
        let input = null;
        if (targetId) {
          input = document.getElementById(targetId);
        }
        if (!input) {
          const parent = btn.parentElement;
          if (parent) input = parent.querySelector('input[type="password"], input[type="text"]');
        }
        if (!input) return;

        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
      });
    });
  }

  /* ==========================================================================
     17. WEDDING DETAILS
     ========================================================================== */
  function initWeddingDetails() {
    const brideInput = firstExisting(['#brideName', 'input[name="bride"]']);
    const groomInput = firstExisting(['#groomName', 'input[name="groom"]']);
    const dateInput = firstExisting(['#weddingDate', 'input[name="weddingDate"]']);
    const locationInput = firstExisting(['#weddingLocation', 'input[name="location"]']);
    const budgetInput = firstExisting(['#weddingBudget', 'input[name="budget"]']);

    if (!brideInput && !groomInput && !dateInput && !locationInput && !budgetInput) {
      return;
    }

    if (dateInput) {
      try {
        const today = new Date().toISOString().split('T')[0];
        if (!dateInput.getAttribute('min')) dateInput.setAttribute('min', today);
      } catch (e) { /* silent */ }
    }

    const saved = loadData(STORAGE_KEYS.WEDDING, {});
    if (saved) {
      if (brideInput && saved.bride && !brideInput.value) brideInput.value = saved.bride;
      if (groomInput && saved.groom && !groomInput.value) groomInput.value = saved.groom;
      if (dateInput && saved.date && !dateInput.value) {
        try {
          const d = new Date(saved.date);
          if (!isNaN(d.getTime())) dateInput.value = d.toISOString().split('T')[0];
        } catch (e) { /* silent */ }
      }
      if (locationInput && saved.location && !locationInput.value) locationInput.value = saved.location;
      if (budgetInput && saved.budget && !budgetInput.value) budgetInput.value = saved.budget;
    }

    function save() {
      const data = {
        bride: brideInput ? brideInput.value : '',
        groom: groomInput ? groomInput.value : '',
        date: dateInput && dateInput.value ? new Date(dateInput.value).toISOString() : DEFAULT_WEDDING_DATE,
        location: locationInput ? locationInput.value : '',
        budget: budgetInput ? parseFloat(budgetInput.value) || 0 : 0
      };
      saveData(STORAGE_KEYS.WEDDING, data);
    }

    [brideInput, groomInput, dateInput, locationInput, budgetInput].forEach(function (el) {
      if (el) el.addEventListener('change', save);
    });
  }

  /* ==========================================================================
     18. SCROLL TO TOP
     ========================================================================== */
  function initScrollToTop() {
    let btn = firstExisting(['#scrollTopBtn', '.scroll-top', '[data-scroll-top]']);

    if (!btn) {
      btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'scrollTopBtn';
      btn.className = 'scroll-top';
      btn.setAttribute('aria-label', 'Scroll to top');
      btn.innerHTML = '<i class="fas fa-chevron-up"></i>';
      btn.style.position = 'fixed';
      btn.style.bottom = '28px';
      btn.style.right = '28px';
      btn.style.width = '48px';
      btn.style.height = '48px';
      btn.style.borderRadius = '50%';
      btn.style.background = '#2e2e2e';
      btn.style.color = '#ffffff';
      btn.style.display = 'flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.style.fontSize = '1.1rem';
      btn.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
      btn.style.opacity = '0';
      btn.style.visibility = 'hidden';
      btn.style.transition = 'all 0.3s ease';
      btn.style.zIndex = '999';
      btn.style.cursor = 'pointer';
      btn.style.border = 'none';
      document.body.appendChild(btn);
    }

    window.addEventListener('scroll', function () {
      if (window.pageYOffset > 400) {
        btn.style.opacity = '1';
        btn.style.visibility = 'visible';
        btn.classList.add('visible');
      } else {
        btn.style.opacity = '0';
        btn.style.visibility = 'hidden';
        btn.classList.remove('visible');
      }
    });

    btn.addEventListener('click', function () {
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (e) {
        window.scrollTo(0, 0);
      }
    });
  }

  /* ==========================================================================
     19. RESET DEMO DATA
     ========================================================================== */
  function initReset() {
    const resetBtn = firstExisting(['#resetDataBtn', '[data-reset]', '.reset-btn']);
    if (!resetBtn) return;

    resetBtn.addEventListener('click', function () {
      const confirmed = window.confirm(
        'Are you sure you want to reset your wedding plan? This will clear all saved demo data.'
      );
      if (!confirmed) return;

      clearWedoraData();
      showToast('All demo data has been reset', 'info');
      setTimeout(function () {
        window.location.reload();
      }, 800);
    });
  }

  /* ==========================================================================
     20. ESCAPE KEY & MODAL OVERLAY BEHAVIOR
     ========================================================================== */
  function initModalEscape() {
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeAllModals();
      }
    });
  }

  /* ==========================================================================
     21. INITIALIZATION
     ========================================================================== */
  function safeInit(name, fn) {
    try {
      fn();
    } catch (error) {
      // Silently skip module on failure to keep the app stable
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('Wedora: ' + name + ' initialization skipped.');
      }
    }
  }

  function initializeApp() {
    safeInit('mobile nav', initMobileNav);
    safeInit('smooth scroll', initSmoothScroll);
    safeInit('active nav', initActiveNav);
    safeInit('modal escape', initModalEscape);
    safeInit('login', initLogin);
    safeInit('register', initRegister);
    safeInit('contact', initContactForm);
    safeInit('checklist', initChecklist);
    safeInit('budget', initBudget);
    safeInit('catering', initCatering);
    safeInit('guests', initGuests);
    safeInit('vendors', initVendors);
    safeInit('countdown', initCountdown);
    safeInit('password toggle', initPasswordToggle);
    safeInit('wedding details', initWeddingDetails);
    safeInit('scroll to top', initScrollToTop);
    safeInit('reset', initReset);

    // Welcome toast
    setTimeout(function () {
      showToast('Welcome to Wedora! Start planning your dream wedding.', 'info');
    }, 800);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    initializeApp();
  }

  // Expose safely (optional use from inline HTML)
  window.Wedora = {
    showToast: showToast,
    openModal: openModal,
    closeModal: closeModal,
    closeAllModals: closeAllModals,
    saveData: saveData,
    loadData: loadData,
    removeData: removeData,
    storageKeys: STORAGE_KEYS
  };
})();
```