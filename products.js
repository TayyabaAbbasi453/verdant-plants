/* ==========================================================================
   VERDANT — products.js
   Loads plants.json and renders: home featured + categories,
   shop catalog (search/filter/sort/pagination/quick view),
   plant details page + related products.
   ========================================================================== */

(function (V) {
  'use strict';

  const DATA_URL = '../data/plants.json';
  const CATEGORY_META = {
    'Indoor Plants': { icon: 'bi-flower1', img: '/images/indoor plant.webp' },
    'Outdoor Plants': { icon: 'bi-tree', img: '/images/outdoor plant.jpg' },
    'Succulents': { icon: 'bi-flower3', img: '/images/Succulents.avif' },
    'Hanging Plants': { icon: 'bi-droplet', img: '/images/hanging plant.webp' },
    'Air Purifying Plants': { icon: 'bi-wind', img: '/images/air purifying.webp' }
  };

  V.loadProducts = function () {
    return fetch(DATA_URL)
      .then(res => { if (!res.ok) throw new Error('Network response not ok'); return res.json(); })
      .catch(err => {
        console.error('Failed to load plants.json. If you opened this file directly (/Pages/Shop.html), ' +
          'run a local server (e.g. `python -m http.server`) so fetch() can load JSON data.', err);
        return [];
      });
  };

  function starString(rating) {
    const full = Math.round(rating);
    let s = '';
    for (let i = 1; i <= 5; i++) s += `<i class="bi ${i <= full ? 'bi-star-fill' : 'bi-star'}"></i>`;
    return s;
  }

  function productCardHTML(p) {
    const inWishlist = V.Wishlist ? V.Wishlist.has(p.id) : false;
    return `
    <div class="product-card reveal" data-id="${p.id}" data-name="${p.name.toLowerCase()}" data-cat="${p.category}" data-price="${p.price}">
      ${p.badge ? `<span class="product-badge ${p.badge === 'New' ? 'gold' : ''}">${p.badge}</span>` : ''}
      <div class="product-img-wrap">
        <img src="${p.image}" alt="${p.name}" loading="lazy">
        <div class="product-actions">
          <button class="icon-btn wishlist-toggle ${inWishlist ? 'active' : ''}" data-id="${p.id}" title="Wishlist"><i class="bi bi-heart${inWishlist ? '-fill' : ''}"></i></button>
          <button class="icon-btn quick-view" data-id="${p.id}" title="Quick View" data-bs-toggle="modal" data-bs-target="#quickViewModal"><i class="bi bi-eye"></i></button>
        </div>
        <div class="product-glass-overlay">
          <button class="btn btn-leaf btn-sm w-100 add-to-cart" data-id="${p.id}"><i class="bi bi-bag-plus me-1"></i> Add to Cart</button>
        </div>
      </div>
      <div class="product-info">
        <div class="product-cat">${p.category}</div>
        <h3 class="product-name h6"><a href="Pages/Detail.html?id=${p.id}">${p.name}</a></h3>
        <div class="product-rating mb-1">${starString(p.rating)} <span class="text-muted small">(${p.reviews})</span></div>
        <div class="d-flex justify-content-between align-items-center">
          <span class="product-price">${V.formatPrice(p.price)}${p.oldPrice ? `<span class="old">${V.formatPrice(p.oldPrice)}</span>` : ''}</span>
        </div>
      </div>
    </div>`;
  }

  function bindCardEvents(container, allProducts) {
    container.querySelectorAll('.add-to-cart').forEach(btn => btn.addEventListener('click', function (e) {
      e.preventDefault();
      const p = allProducts.find(x => x.id === Number(this.dataset.id));
      if (p) V.Cart.add(p, 1);
    }));
    container.querySelectorAll('.wishlist-toggle').forEach(btn => btn.addEventListener('click', function (e) {
      e.preventDefault();
      const p = allProducts.find(x => x.id === Number(this.dataset.id));
      if (p) {
        const added = V.Wishlist.toggle(p);
        this.classList.toggle('active', added);
        this.querySelector('i').className = `bi bi-heart${added ? '-fill' : ''}`;
      }
    }));  
    container.querySelectorAll('.quick-view').forEach(btn => btn.addEventListener('click', function () {
      const p = allProducts.find(x => x.id === Number(this.dataset.id));
      if (p) renderQuickView(p);
    }));
    // re-trigger reveal for dynamically injected cards
    V.qsa('.reveal', container).forEach(el => {
      requestAnimationFrame(() => el.classList.add('in'));
    });
  }

  function renderQuickView(p) {
    const modal = V.qs('#quickViewModal');
    if (!modal) return;
    modal.querySelector('.qv-image').src = p.image;
    modal.querySelector('.qv-image').alt = p.name;
    modal.querySelector('.qv-cat').textContent = p.category;
    modal.querySelector('.qv-name').textContent = p.name;
    modal.querySelector('.qv-rating').innerHTML = starString(p.rating) + ` <span class="text-muted small">(${p.reviews} reviews)</span>`;
    modal.querySelector('.qv-price').innerHTML = V.formatPrice(p.price) + (p.oldPrice ? `<span class="old">${V.formatPrice(p.oldPrice)}</span>` : '');
    modal.querySelector('.qv-desc').textContent = p.description;
    modal.querySelector('.qv-stock').textContent = p.stock > 0 ? `In Stock (${p.stock} available)` : 'Out of Stock';
    modal.querySelector('.qv-link').href = `/Pages/Detail.html?id=${p.id}`;
    const addBtn = modal.querySelector('.qv-add-cart');
    addBtn.onclick = () => V.Cart.add(p, 1);
  }

  /* ===================== HOME PAGE ===================== */
  function initHomePage(products) {
    const featuredGrid = V.qs('#featuredGrid');
    const catGrid = V.qs('#categoryGrid');
    if (!featuredGrid && !catGrid) return;

    if (catGrid) {
      const cats = [...new Set(products.map(p => p.category))];
      catGrid.innerHTML = cats.map(c => {
        const meta = CATEGORY_META[c] || { icon: 'bi-flower1', img: 'https://picsum.photos/seed/catdefault/700/600' };
        const count = products.filter(p => p.category === c).length;
        return `
        <div class="col-sm-6 col-lg-4 col-xl-3">
          <a href="Pages/Shop.html?category=${encodeURIComponent(c)}" class="cat-card d-block reveal">
            <img src="${meta.img}" alt="${c}" loading="lazy">
            <div class="cat-overlay">
              <i class="bi ${meta.icon} fs-3 mb-2 text-gold"></i>
              <h5>${c}</h5>
              <span>${count} Products</span>
              <span class="explore-link">Explore Collection <i class="bi bi-arrow-right"></i></span>
            </div>
          </a>
        </div>`;
      }).join('');
      V.qsa('.reveal', catGrid).forEach(el => requestAnimationFrame(() => el.classList.add('in')));
    }

    if (featuredGrid) {
      const featured = products.filter(p => p.badge).concat(products.filter(p => !p.badge)).slice(0, 8);
      featuredGrid.innerHTML = featured.map(p => `<div class="col-sm-6 col-lg-4 col-xl-3">${productCardHTML(p)}</div>`).join('');
      bindCardEvents(featuredGrid, products);
    }
  }

  /* ===================== SHOP PAGE ===================== */
  function initShopPage(products) {
    const grid = V.qs('#shopGrid');
    if (!grid) return;

    const params = new URLSearchParams(location.search);
    let state = {
      search: params.get('search') || '',
      category: params.get('category') || 'all',
      maxPrice: 100,
      sort: 'default',
      view: 'grid',
      page: 1,
      perPage: 9
    };

    const searchInput = V.qs('#shopSearch');
    const categorySelect = V.qs('#shopCategory');
    const priceRange = V.qs('#shopPriceRange');
    const priceValue = V.qs('#shopPriceValue');
    const sortSelect = V.qs('#shopSort');
    const gridBtn = V.qs('#viewGridBtn');
    const listBtn = V.qs('#viewListBtn');
    const resultsCount = V.qs('#resultsCount');
    const pagination = V.qs('#shopPagination');
    const noResults = V.qs('#shopNoResults');

    if (searchInput) searchInput.value = state.search;
    if (categorySelect) categorySelect.value = state.category;

    function getFiltered() {
      let list = products.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(state.search.toLowerCase());
        const matchCat = state.category === 'all' || p.category === state.category;
        const matchPrice = p.price <= state.maxPrice;
        return matchSearch && matchCat && matchPrice;
      });
      switch (state.sort) {
        case 'price-asc': list.sort((a, b) => a.price - b.price); break;
        case 'price-desc': list.sort((a, b) => b.price - a.price); break;
        case 'name-asc': list.sort((a, b) => a.name.localeCompare(b.name)); break;
        case 'name-desc': list.sort((a, b) => b.name.localeCompare(a.name)); break;
      }
      return list;
    }

    function render() {
      const filtered = getFiltered();
      const totalPages = Math.max(1, Math.ceil(filtered.length / state.perPage));
      state.page = Math.min(state.page, totalPages);
      const start = (state.page - 1) * state.perPage;
      const pageItems = filtered.slice(start, start + state.perPage);

      if (resultsCount) resultsCount.textContent = `${filtered.length} plant${filtered.length !== 1 ? 's' : ''} found`;

      if (!filtered.length) {
        grid.innerHTML = '';
        if (noResults) noResults.style.display = 'block';
      } else {
        if (noResults) noResults.style.display = 'none';
        grid.innerHTML = pageItems.map(p => {
          if (state.view === 'list') {
            return `<div class="col-12">${productCardHTML(p).replace('product-card reveal', 'product-card reveal list-view')}</div>`;
          }
          return `<div class="col-sm-6 col-lg-4">${productCardHTML(p)}</div>`;
        }).join('');
        bindCardEvents(grid, products);
      }

      renderPagination(totalPages);
    }

    function renderPagination(totalPages) {
      if (!pagination) return;
      if (totalPages <= 1) { pagination.innerHTML = ''; return; }
      let html = '';
      html += `<li class="page-item ${state.page === 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${state.page - 1}">Prev</a></li>`;
      for (let i = 1; i <= totalPages; i++) {
        html += `<li class="page-item ${i === state.page ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
      }
      html += `<li class="page-item ${state.page === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${state.page + 1}">Next</a></li>`;
      pagination.innerHTML = html;
      pagination.querySelectorAll('.page-link').forEach(a => a.addEventListener('click', function (e) {
        e.preventDefault();
        const p = Number(this.dataset.page);
        if (p >= 1 && p <= totalPages) { state.page = p; render(); window.scrollTo({ top: grid.offsetTop - 120, behavior: 'smooth' }); }
      }));
    }

    if (searchInput) searchInput.addEventListener('input', function () { state.search = this.value; state.page = 1; render(); });
    if (categorySelect) categorySelect.addEventListener('change', function () { state.category = this.value; state.page = 1; render(); });
    if (priceRange) priceRange.addEventListener('input', function () {
      state.maxPrice = Number(this.value);
      if (priceValue) priceValue.textContent = V.formatPrice(state.maxPrice);
      state.page = 1; render();
    });
    if (sortSelect) sortSelect.addEventListener('change', function () { state.sort = this.value; render(); });
    if (gridBtn && listBtn) {
      gridBtn.addEventListener('click', () => { state.view = 'grid'; gridBtn.classList.add('active'); listBtn.classList.remove('active'); render(); });
      listBtn.addEventListener('click', () => { state.view = 'list'; listBtn.classList.add('active'); gridBtn.classList.remove('active'); render(); });
    }

    render();
  }

  /* ===================== DETAILS PAGE ===================== */
  function initDetailsPage(products) {
    const wrap = V.qs('#detailsWrap');
    if (!wrap) return;
    const params = new URLSearchParams(location.search);
    const id = Number(params.get('id')) || products[0]?.id;
    const p = products.find(x => x.id === id);

    if (!p) {
      wrap.innerHTML = '<div class="text-center py-5"><h4>Plant not found</h4><a href="Pages/Shop.html" class="btn btn-leaf mt-3">Back to Shop</a></div>';
      return;
    }

    document.title = p.name + ' — Verdant';
    V.qs('#detailsCrumb') && (V.qs('#detailsCrumb').textContent = p.name);
    V.qs('#mainImage').src = p.image;
    V.qs('#mainImage').alt = p.name;
    V.qs('#galleryThumbs').innerHTML = (p.gallery || [p.image]).map((g, i) =>
      `<img src="${g}" class="img-thumbnail thumb-img ${i === 0 ? 'border-success' : ''}" style="width:72px;height:72px;object-fit:cover;cursor:pointer;" data-src="${g}">`
    ).join('');
    V.qsa('.thumb-img').forEach(t => t.addEventListener('click', function () {
      V.qs('#mainImage').src = this.dataset.src;
      V.qsa('.thumb-img').forEach(x => x.classList.remove('border-success'));
      this.classList.add('border-success');
    }));

    V.qs('#detailsCat').textContent = p.category;
    V.qs('#detailsName').textContent = p.name;
    V.qs('#detailsRating').innerHTML = starString(p.rating) + ` <span class="text-muted">(${p.reviews} reviews)</span>`;
    V.qs('#detailsPrice').innerHTML = V.formatPrice(p.price) + (p.oldPrice ? `<span class="old">${V.formatPrice(p.oldPrice)}</span>` : '');
    V.qs('#detailsStock').innerHTML = p.stock > 0
      ? `<span class="text-success"><i class="bi bi-check-circle-fill"></i> In Stock — ${p.stock} available</span>`
      : `<span class="text-danger"><i class="bi bi-x-circle-fill"></i> Out of Stock</span>`;
    V.qs('#detailsDesc').textContent = p.description;
    V.qs('#detailsCare') && (V.qs('#detailsCare').textContent = p.care || '');
    V.qs('#detailsSize') && (V.qs('#detailsSize').textContent = p.size || '');

    const qtyInput = V.qs('#detailsQty');
    V.qs('#qtyMinus').addEventListener('click', () => { qtyInput.value = Math.max(1, Number(qtyInput.value) - 1); });
    V.qs('#qtyPlus').addEventListener('click', () => { qtyInput.value = Math.min(p.stock || 99, Number(qtyInput.value) + 1); });

    V.qs('#addToCartBtn').addEventListener('click', () => V.Cart.add(p, Number(qtyInput.value) || 1));
    const wishBtn = V.qs('#addToWishlistBtn');
    const inWishlist = V.Wishlist.has(p.id);
    wishBtn.classList.toggle('active', inWishlist);
    wishBtn.innerHTML = `<i class="bi bi-heart${inWishlist ? '-fill' : ''}"></i> ${inWishlist ? 'In Wishlist' : 'Add to Wishlist'}`;
    wishBtn.addEventListener('click', () => {
      const added = V.Wishlist.toggle(p);
      wishBtn.classList.toggle('active', added);
      wishBtn.innerHTML = `<i class="bi bi-heart${added ? '-fill' : ''}"></i> ${added ? 'In Wishlist' : 'Add to Wishlist'}`;
    });

    const relatedGrid = V.qs('#relatedGrid');
    if (relatedGrid) {
      const related = products.filter(x => x.category === p.category && x.id !== p.id).slice(0, 4);
      relatedGrid.innerHTML = related.map(r => `<div class="col-sm-6 col-lg-3">${productCardHTML(r)}</div>`).join('');
      bindCardEvents(relatedGrid, products);
    }
  }

  /* ===================== INIT ===================== */
  document.addEventListener('DOMContentLoaded', function () {
    V.loadProducts().then(products => {
      V.allProducts = products;
      initHomePage(products);
      initShopPage(products);
      initDetailsPage(products);
      V.qs('#statProducts') && (V.qs('#statProducts').dataset.count = products.length);
    });
  });

})(window.VERDANT);