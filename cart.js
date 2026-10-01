/* ==========================================================================
   VERDANT — cart.js
   Cart storage + cart page rendering, totals, coupon, shipping.
   ========================================================================== */

(function (V) {
  'use strict';

  const SHIPPING_FLAT = 5.99;
  const FREE_SHIP_THRESHOLD = 60;
  const TAX_RATE = 0.05;
  const COUPONS = { 'VERDANT10': 0.10, 'GREEN20': 0.20, 'WELCOME15': 0.15 };

  V.Cart = {
    get()       { return V.getJSON(V.KEYS.CART, []); },
    save(cart)  { V.setJSON(V.KEYS.CART, cart); V.updateBadges(); },

    add(product, qty) {
      qty = qty || 1;
      const cart     = this.get();
      const existing = cart.find(i => i.id === product.id);
      if (existing) {
        existing.qty += qty;
      } else {
        cart.push({
          id: product.id, name: product.name, price: product.price,
          image: product.image, category: product.category, qty
        });
      }
      this.save(cart);
      V.toast(`${product.name} added to cart`, 'success');
    },

    remove(id) {
      const cart = this.get().filter(i => i.id !== id);
      this.save(cart);
      V.toast('Item removed from cart', 'info');
    },

    updateQty(id, qty) {
      const cart = this.get();
      const item = cart.find(i => i.id === id);
      if (item) {
        item.qty = Math.max(1, qty);
        this.save(cart);
      }
    },

    clear()     { this.save([]); },

    subtotal()  {
      return this.get().reduce((sum, i) => sum + i.price * i.qty, 0);
    }
  };

  /* ---------- Cart page rendering ---------- */
  function renderCartPage() {
    const wrap = V.qs('#cartItemsWrap');
    if (!wrap) return;

    const cart       = V.Cart.get();
    const emptyState = V.qs('#cartEmptyState');
    const summary    = V.qs('#cartSummary');

    if (!cart.length) {
      wrap.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      if (summary)    summary.style.display    = 'none';
      updateTotals();
      return;
    }
    if (emptyState) emptyState.style.display = 'none';
    if (summary)    summary.style.display    = 'block';

    wrap.innerHTML = cart.map(item => `
      <div class="d-flex align-items-center gap-3 py-3 border-bottom" data-id="${item.id}">
        <img src="${item.image}" alt="${item.name}"
             class="rounded-3" style="width:84px;height:84px;object-fit:cover;">
        <div class="flex-grow-1">
          <h6 class="mb-1">${item.name}</h6>
          <div class="text-muted small mb-2">${item.category}</div>
          <div class="qty-stepper">
            <button type="button" class="qty-minus"><i class="bi bi-dash"></i></button>
            <input type="number" min="1" value="${item.qty}"
                   class="qty-input" data-id="${item.id}">
            <button type="button" class="qty-plus"><i class="bi bi-plus"></i></button>
          </div>
        </div>
        <div class="text-end">
          <div class="fw-bold text-dark-green">${V.formatPrice(item.price * item.qty)}</div>
          <small class="text-muted">${V.formatPrice(item.price)} each</small>
        </div>
        <button class="icon-btn remove-item" data-id="${item.id}" aria-label="Remove">
          <i class="bi bi-trash3"></i>
        </button>
      </div>
    `).join('');

    wrap.querySelectorAll('.remove-item').forEach(btn =>
      btn.addEventListener('click', function () {
        V.Cart.remove(Number(this.dataset.id));
        renderCartPage();
      })
    );
    wrap.querySelectorAll('.qty-minus').forEach(btn =>
      btn.addEventListener('click', function () {
        const input = this.parentElement.querySelector('.qty-input');
        V.Cart.updateQty(Number(input.dataset.id), Math.max(1, Number(input.value) - 1));
        renderCartPage();
      })
    );
    wrap.querySelectorAll('.qty-plus').forEach(btn =>
      btn.addEventListener('click', function () {
        const input = this.parentElement.querySelector('.qty-input');
        V.Cart.updateQty(Number(input.dataset.id), Number(input.value) + 1);
        renderCartPage();
      })
    );
    wrap.querySelectorAll('.qty-input').forEach(input =>
      input.addEventListener('change', function () {
        V.Cart.updateQty(Number(this.dataset.id), Number(this.value) || 1);
        renderCartPage();
      })
    );

    updateTotals();
  }

  let appliedCoupon = 0;

  function updateTotals() {
    const subtotal = V.Cart.subtotal();
    const shipping = subtotal === 0 ? 0 : (subtotal >= FREE_SHIP_THRESHOLD ? 0 : SHIPPING_FLAT);
    const discount = subtotal * appliedCoupon;
    const taxable  = subtotal - discount;
    const tax      = taxable * TAX_RATE;
    const total    = taxable + tax + shipping;

    const set = (id, val) => {
      const el = V.qs(id);
      if (el) el.textContent = V.formatPrice(val);
    };
    set('#sumSubtotal', subtotal);
    set('#sumShipping', shipping);
    set('#sumTax',      tax);
    set('#sumDiscount', discount);
    set('#sumTotal',    total);

    const shipNote = V.qs('#shipNote');
    if (shipNote) {
      shipNote.textContent = subtotal === 0 ? '' : (
        subtotal >= FREE_SHIP_THRESHOLD
          ? 'You qualify for free shipping! 🎉'
          : `Add ${V.formatPrice(FREE_SHIP_THRESHOLD - subtotal)} more for free shipping`
      );
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderCartPage();

    const couponForm = V.qs('#couponForm');
    if (couponForm) {
      couponForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const code = V.qs('#couponInput').value.trim().toUpperCase();
        if (COUPONS[code]) {
          appliedCoupon = COUPONS[code];
          V.toast(`Coupon applied: ${code} (${COUPONS[code] * 100}% off)`, 'success');
        } else {
          appliedCoupon = 0;
          V.toast('Invalid coupon code', 'error');
        }
        updateTotals();
      });
    }

    const checkoutBtn = V.qs('#checkoutBtn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', function () {
        if (!V.Cart.get().length) {
          V.toast('Your cart is empty', 'error');
          return;
        }
        const user = V.getJSON(V.KEYS.CURRENT_USER, null);
        if (!user) {
          V.toast('Please login to checkout', 'info');
          setTimeout(() => location.href = 'login.html', 800);
          return;
        }
        V.toast('Order placed successfully! 🌿', 'success');
        V.Cart.clear();
        setTimeout(renderCartPage, 600);
      });
    }
  });

})(window.VERDANT);