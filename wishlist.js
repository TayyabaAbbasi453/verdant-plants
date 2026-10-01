/* ==========================================================================
   VERDANT — wishlist.js
   Wishlist storage + wishlist page rendering.
   ========================================================================== */

(function (V) {
  'use strict';

  V.Wishlist = {
    get() { return V.getJSON(V.KEYS.WISHLIST, []); },
    save(list) { V.setJSON(V.KEYS.WISHLIST, list); V.updateBadges(); },

    has(id) { return this.get().some(i => i.id === id); },

    toggle(product) {
      const list = this.get();
      const idx = list.findIndex(i => i.id === product.id);
      if (idx > -1) {
        list.splice(idx, 1);
        this.save(list);
        V.toast(`${product.name} removed from wishlist`, 'info');
        return false;
      } else {
        list.push({
          id: product.id, name: product.name, price: product.price,
          image: product.image, category: product.category, rating: product.rating
        });
        this.save(list);
        V.toast(`${product.name} added to wishlist`, 'success');
        return true;
      }
    },

    remove(id) {
      const list = this.get().filter(i => i.id !== id);
      this.save(list);
    }
  };

  function renderWishlistPage() {
    const wrap = V.qs('#wishlistGrid');
    if (!wrap) return;
    const list = V.Wishlist.get();
    const emptyState = V.qs('#wishlistEmptyState');

    if (!list.length) {
      wrap.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }
    if (emptyState) emptyState.style.display = 'none';

    wrap.innerHTML = list.map(item => `
      <div class="col-sm-6 col-lg-4 col-xl-3">
        <div class="product-card reveal in">
          <div class="product-img-wrap">
            <img src="${item.image}" alt="${item.name}" loading="lazy">
            <div class="product-actions">
              <button class="icon-btn remove-wishlist" data-id="${item.id}" title="Remove"><i class="bi bi-trash3"></i></button>
            </div>
          </div>
          <div class="product-info">
            <div class="product-cat">${item.category}</div>
            <h3 class="product-name h6"><a href="Pages/Detail.html?id=${item.id}">${item.name}</a></h3>
            <div class="d-flex justify-content-between align-items-center mt-2">
              <span class="product-price">${V.formatPrice(item.price)}</span>
              <button class="btn btn-leaf btn-sm move-to-cart" data-id="${item.id}">Move to Cart</button>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    wrap.querySelectorAll('.remove-wishlist').forEach(btn => btn.addEventListener('click', function () {
      V.Wishlist.remove(Number(this.dataset.id));
      renderWishlistPage();
    }));
    wrap.querySelectorAll('.move-to-cart').forEach(btn => btn.addEventListener('click', function () {
      const id = Number(this.dataset.id);
      const item = V.Wishlist.get().find(i => i.id === id);
      if (item) {
        V.Cart.add(item, 1);
        V.Wishlist.remove(id);
        renderWishlistPage();
      }
    }));
  }

  document.addEventListener('DOMContentLoaded', renderWishlistPage);

})(window.VERDANT);