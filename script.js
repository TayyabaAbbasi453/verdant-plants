/* ==========================================================================
   VERDANT — app.js
   Shared site-wide behaviour: navbar, dark mode, toasts, animations,
   floating leaves, back-to-top, scroll reveal, animated counters.
   ========================================================================== */

window.VERDANT = window.VERDANT || {};

(function (V) {
  'use strict';

  /* ---------- Storage keys (shared across modules) ---------- */
  V.KEYS = {
    USERS: 'verdant_users',
    CURRENT_USER: 'verdant_currentUser',
    CART: 'verdant_cart',
    WISHLIST: 'verdant_wishlist'
  };

  /* ---------- Helpers ---------- */
  V.getJSON = function (key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : (fallback !== undefined ? fallback : null);
    } catch (e) {
      return fallback !== undefined ? fallback : null;
    }
  };
  V.setJSON = function (key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  };
  V.formatPrice = function (n) {
    return '$' + Number(n).toFixed(2);
  };
  V.qs = (sel, ctx) => (ctx || document).querySelector(sel);
  V.qsa = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  /* ---------- Page loader ---------- */
  window.addEventListener('load', function () {
    const loader = V.qs('.page-loader');
    if (loader) {
      setTimeout(() => loader.classList.add('hide'), 350);
    }
  });

  /* ---------- Floating leaves background ---------- */
  V.spawnLeaves = function (container, count) {
    if (!container) return;
    const icons = ['bi-flower1', 'bi-tree', 'bi-flower3'];
    for (let i = 0; i < (count || 14); i++) {
      const leaf = document.createElement('i');
      leaf.className = 'leaf bi ' + icons[i % icons.length];
      leaf.style.left = Math.random() * 100 + '%';
      leaf.style.animationDuration = (10 + Math.random() * 12) + 's';
      leaf.style.animationDelay = (Math.random() * 10) + 's';
      leaf.style.fontSize = (1 + Math.random() * 1.4) + 'rem';
      container.appendChild(leaf);
    }
  };
  document.addEventListener('DOMContentLoaded', function () {
    V.qsa('.leaves-bg').forEach(el => V.spawnLeaves(el, 12));
  });

  /* ---------- Navbar scroll state ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    const nav = V.qs('.navbar-glass');
    if (!nav) return;
    const onScroll = () => {
      nav.classList.toggle('scrolled', window.scrollY > 30);
      const btt = V.qs('.back-to-top');
      if (btt) btt.classList.toggle('show', window.scrollY > 500);
    };
    window.addEventListener('scroll', onScroll);
    onScroll();

    // Highlight active link based on current page
    const path = location.pathname.split('/').pop() || 'index.html';
    V.qsa('.navbar-glass .nav-link').forEach(a => {
      const href = a.getAttribute('href');
      if (href === path) a.classList.add('active');
    });
  });

  /* ---------- Dark mode ---------- */
  V.initDarkMode = function () {
    const saved = localStorage.getItem('verdant_theme');
    if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    V.qsa('.dark-toggle').forEach(btn => {
      updateToggleIcon(btn);
      btn.addEventListener('click', function () {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
          document.documentElement.removeAttribute('data-theme');
          localStorage.setItem('verdant_theme', 'light');
        } else {
          document.documentElement.setAttribute('data-theme', 'dark');
          localStorage.setItem('verdant_theme', 'dark');
        }
        V.qsa('.dark-toggle').forEach(updateToggleIcon);
      });
    });
    function updateToggleIcon(btn) {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const icon = btn.querySelector('i');
      if (icon) icon.className = isDark ? 'bi bi-sun' : 'bi bi-moon-stars';
    }
  };
  document.addEventListener('DOMContentLoaded', V.initDarkMode);

  /* ---------- Toast notifications ---------- */
  V.toast = function (message, type) {
    type = type || 'success';
    let stack = V.qs('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      document.body.appendChild(stack);
    }
    const icons = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', info: 'bi-info-circle-fill' };
    const colors = { success: 'var(--primary-green)', error: '#d9534f', info: 'var(--accent-gold)' };
    const el = document.createElement('div');
    el.className = 'rounded-pill-soft shadow-lg px-4 py-3 d-flex align-items-center gap-2';
    el.style.cssText = `background: var(--bg); color: var(--text); border-left: 4px solid ${colors[type]}; min-width:260px; animation: fadeUp .3s ease;`;
    el.innerHTML = `<i class="bi ${icons[type]}" style="color:${colors[type]}"></i><span>${message}</span>`;
    stack.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity .35s ease, transform .35s ease';
      el.style.opacity = '0';
      el.style.transform = 'translateX(20px)';
      setTimeout(() => el.remove(), 350);
    }, 2800);
  };

  /* ---------- Back to top ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    let btt = V.qs('.back-to-top');
    if (!btt) {
      btt = document.createElement('button');
      btt.className = 'back-to-top';
      btt.innerHTML = '<i class="bi bi-arrow-up"></i>';
      btt.setAttribute('aria-label', 'Back to top');
      document.body.appendChild(btt);
    }
    btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  });

  /* ---------- Scroll reveal ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    const items = V.qsa('.reveal');
    if (!items.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    items.forEach(el => io.observe(el));
  });

  /* ---------- Animated counters ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    const counters = V.qsa('.counter-num[data-count]');
    if (!counters.length) return;
    const animate = (el) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      let cur = 0;
      const step = Math.max(target / 60, 0.5);
      const tick = () => {
        cur += step;
        if (cur >= target) { el.textContent = target + suffix; return; }
        el.textContent = Math.floor(cur) + suffix;
        requestAnimationFrame(tick);
      };
      tick();
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { animate(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(el => io.observe(el));
  });

  /* ---------- Newsletter form (shared) ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    V.qsa('.newsletter-form').forEach(form => {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const input = form.querySelector('input[type="email"]');
        if (input && input.checkValidity()) {
          V.toast('Subscribed! Welcome to the Verdant family 🌿', 'success');
          form.reset();
        } else {
          V.toast('Please enter a valid email address', 'error');
        }
      });
    });
  });

  /* ---------- Badge counts (cart / wishlist) ---------- */
  V.updateBadges = function () {
    const cart = V.getJSON(V.KEYS.CART, []);
    const wishlist = V.getJSON(V.KEYS.WISHLIST, []);
    const cartCount = cart.reduce((sum, i) => sum + (i.qty || 1), 0);
    V.qsa('.cart-badge').forEach(b => { b.textContent = cartCount; b.style.display = cartCount ? 'flex' : 'none'; });
    V.qsa('.wishlist-badge').forEach(b => { b.textContent = wishlist.length; b.style.display = wishlist.length ? 'flex' : 'none'; });
  };
  document.addEventListener('DOMContentLoaded', V.updateBadges);

  /* ---------- Auth nav state ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    const user = V.getJSON(V.KEYS.CURRENT_USER, null);
    const guestEls = V.qsa('.auth-guest-only');
    const userEls = V.qsa('.auth-user-only');
    guestEls.forEach(el => el.style.display = user ? 'none' : '');
    userEls.forEach(el => el.style.display = user ? '' : 'none');
    V.qsa('.user-name-display').forEach(el => { if (user) el.textContent = user.name; });
    V.qsa('.logout-btn').forEach(btn => btn.addEventListener('click', function (e) {
      e.preventDefault();
      localStorage.removeItem(V.KEYS.CURRENT_USER);
      V.toast('Logged out successfully', 'success');
      setTimeout(() => location.href = '/index.html', 700);
    }));
  });

})(window.VERDANT);