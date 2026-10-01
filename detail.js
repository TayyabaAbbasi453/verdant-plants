
document.addEventListener('DOMContentLoaded', function () {

  /* Tab switching */
  document.querySelectorAll('.detail-tabs .nav-link').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.detail-tabs .nav-link').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const t = this.dataset.tab;
      ['description','care','reviews'].forEach(id => {
        const el = document.getElementById('tab-' + id);
        if (el) el.style.display = id === t ? 'block' : 'none';
      });
    });
  });

  /* Sticky CTA visibility */
  const ctaSection = document.getElementById('addToCartBtn');
  const stickyCta  = document.getElementById('stickyCta');
  if (ctaSection && stickyCta) {
    const io = new IntersectionObserver(entries => {
      stickyCta.style.display = entries[0].isIntersecting ? 'none' : 'flex';
    }, { threshold: 0 });
    io.observe(ctaSection);
  }

  /* Share API */
  const shareBtn = document.getElementById('shareBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', function () {
      if (navigator.share) {
        navigator.share({ title: document.title, url: location.href });
      } else {
        navigator.clipboard.writeText(location.href);
        VERDANT.toast('Link copied to clipboard!', 'success');
      }
    });
  }

  /* Wait for products.js to populate the page */
  function waitForProduct(tries) {
    tries = tries || 0;
    if (tries > 30) return;
    const name = document.getElementById('detailsName');
    if (!name || !name.textContent.trim()) {
      return setTimeout(() => waitForProduct(tries + 1), 150);
    }
    enhancePage();
  }
  waitForProduct();
});

function enhancePage() {
  const skeleton = document.getElementById('detailsSkeleton');
  const content  = document.getElementById('detailsContent');
  const tabs     = document.getElementById('detailsTabs');
  const related  = document.getElementById('relatedSection');

  if (skeleton) skeleton.style.display = 'none';
  if (content)  { content.style.removeProperty('display'); }
  if (tabs)     tabs.style.display = 'block';
  if (related)  related.style.display = 'block';

  const params = new URLSearchParams(location.search);
  const id = Number(params.get('id'));
  const p  = (VERDANT.allProducts || []).find(x => x.id === id) || VERDANT.allProducts?.[0];
  if (!p) return;

  /* Price block */
  const priceEl = document.getElementById('detailsPrice');
  if (priceEl) {
    const save = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
    priceEl.innerHTML =
      `<span class="price-main">${VERDANT.formatPrice(p.price)}</span>` +
      (p.oldPrice ? `<span class="price-old">${VERDANT.formatPrice(p.oldPrice)}</span><span class="price-save">Save ${save}%</span>` : '');
  }

  /* Stars */
  function stars(r) {
    let s = '';
    for (let i = 1; i <= 5; i++) s += i <= Math.round(r) ? '★' : '☆';
    return s;
  }
  const starsEl = document.getElementById('detailsStars');
  const numEl   = document.getElementById('detailsRatingNum');
  const cntEl   = document.getElementById('detailsReviewCount');
  if (starsEl)  starsEl.textContent = stars(p.rating);
  if (numEl)    numEl.textContent   = p.rating.toFixed(1);
  if (cntEl)    cntEl.textContent   = `${p.reviews} reviews`;

  /* Stock bar */
  const maxStock = 50;
  const pct = Math.min(Math.round((p.stock / maxStock) * 100), 100);
  const stockEl = document.getElementById('detailsStock');
  const barFill = document.getElementById('stockBarFill');
  const pctEl   = document.getElementById('stockPercent');
  if (stockEl) stockEl.innerHTML = p.stock > 0
    ? `<span class="text-success"><i class="bi bi-check-circle-fill me-1"></i>In Stock — ${p.stock} left</span>`
    : `<span class="text-danger"><i class="bi bi-x-circle-fill me-1"></i>Out of Stock</span>`;
  if (barFill) barFill.style.width = pct + '%';
  if (pct < 25 && barFill) barFill.style.background = 'linear-gradient(90deg,#e74c3c,#c0392b)';
  if (pctEl)  pctEl.textContent = pct < 25 ? 'Almost sold out!' : '';

  /* Badge overlay */
  const badgeWrap = document.getElementById('imgBadgeWrap');
  if (badgeWrap && p.badge) {
    badgeWrap.innerHTML = `<span class="product-badge ${p.badge === 'New' ? 'gold' : ''}">${p.badge}</span>`;
  }

  /* Tags */
  const tagsEl = document.getElementById('detailsTags');
  if (tagsEl) {
    const tags = [p.category, p.size ? 'Potted Plant' : null, 'Ships in 24h'].filter(Boolean);
    tagsEl.innerHTML = tags.map(t => `<span class="tag-pill me-1 mb-1">${t}</span>`).join('');
  }

  /* Care chips */
  if (p.care) {
    const parts = p.care.split('.');
    document.getElementById('metaWater').textContent = parts[0]?.trim() || 'See care guide';
    document.getElementById('metaLight').textContent = parts[1]?.trim() || 'Varies';
  }
  if (p.size) document.getElementById('metaSize').textContent = p.size;
  const diffMap = { 'Indoor Plants':'Easy','Succulents':'Very Easy','Hanging Plants':'Easy','Outdoor Plants':'Moderate','Air Purifying Plants':'Easy' };
  document.getElementById('metaDiff').textContent = diffMap[p.category] || 'Easy';

  /* Wishlist button */
  const wishBtn = document.getElementById('addToWishlistBtn');
  if (wishBtn) {
    const inWL = VERDANT.Wishlist.has(p.id);
    wishBtn.innerHTML = `<i class="bi bi-heart${inWL ? '-fill' : ''}"></i>`;
    wishBtn.classList.toggle('active', inWL);
    wishBtn.title = inWL ? 'Remove from Wishlist' : 'Add to Wishlist';
    wishBtn.addEventListener('click', function () {
      const added = VERDANT.Wishlist.toggle(p);
      this.innerHTML = `<i class="bi bi-heart${added ? '-fill' : ''}"></i>`;
      this.classList.toggle('active', added);
      this.title = added ? 'Remove from Wishlist' : 'Add to Wishlist';
    });
  }

  /* Sticky CTA */
  const stickyName  = document.getElementById('stickyName');
  const stickyPrice = document.getElementById('stickyPrice');
  const stickyAdd   = document.getElementById('stickyAddBtn');
  if (stickyName)  stickyName.textContent  = p.name;
  if (stickyPrice) stickyPrice.textContent = VERDANT.formatPrice(p.price);
  if (stickyAdd) {
    stickyAdd.addEventListener('click', () => {
      const qty = Number(document.getElementById('detailsQty').value) || 1;
      VERDANT.Cart.add(p, qty);
    });
  }

  /* Description tab */
  const tabDesc    = document.getElementById('tabDesc');
  const tabBullets = document.getElementById('tabBullets');
  const tabDescImg = document.getElementById('tabDescImg');
  if (tabDesc)    tabDesc.textContent = p.description;
  if (tabDescImg) { tabDescImg.src = p.gallery?.[1] || p.image; tabDescImg.alt = p.name; }
  if (tabBullets) {
    const bullets = [
      'Scientifically sourced from trusted growers',
      'Inspected and hardened before dispatch',
      'Arrives in premium eco-friendly packaging',
      'Includes care card with every order'
    ];
    tabBullets.innerHTML = bullets.map(b =>
      `<li class="d-flex align-items-start gap-2"><i class="bi bi-check-circle-fill text-success mt-1"></i><span>${b}</span></li>`
    ).join('');
  }

  /* Care tab */
  const careGrid = document.getElementById('careGrid');
  if (careGrid && p.care) {
    const careItems = [
      { icon: '💧', title: 'Watering',     detail: p.care.split('.')[0]?.trim() || 'As needed' },
      { icon: '☀️', title: 'Light',        detail: p.care.split('.')[1]?.trim() || 'Indirect light' },
      { icon: '🌱', title: 'Soil',         detail: p.care.split('.')[2]?.trim() || 'Well-draining mix' },
      { icon: '🌡️', title: 'Temperature',  detail: '15–28°C (60–82°F)' },
      { icon: '💨', title: 'Humidity',     detail: p.category === 'Succulents' ? 'Low humidity preferred' : 'Moderate to high' },
      { icon: '✂️', title: 'Pruning',      detail: 'Remove dead or yellowing leaves as needed' }
    ];
    careGrid.innerHTML = careItems.map(c => `
      <div class="col-sm-6 col-lg-4">
        <div class="care-card h-100">
          <div class="care-icon">${c.icon}</div>
          <div class="fw-semibold mb-1">${c.title}</div>
          <div class="text-muted small">${c.detail}</div>
        </div>
      </div>`).join('');
  }

  /* Reviews tab */
  const avgEl    = document.getElementById('avgRating');
  const avgStars = document.getElementById('avgStars');
  const avgCnt   = document.getElementById('avgCount');
  const revBadge = document.getElementById('reviewBadge');
  const revBars  = document.getElementById('ratingBars');
  const revList  = document.getElementById('reviewsList');

  if (avgEl)    avgEl.textContent    = p.rating.toFixed(1);
  if (avgStars) avgStars.textContent = stars(p.rating);
  if (avgCnt)   avgCnt.textContent   = `Based on ${p.reviews} reviews`;
  if (revBadge) revBadge.textContent = p.reviews;

  if (revBars) {
    const dist = { 5:70, 4:18, 3:7, 2:3, 1:2 };
    revBars.innerHTML = [5,4,3,2,1].map(n => `
      <div class="d-flex align-items-center gap-2 mb-1" style="font-size:.78rem;">
        <span style="width:18px;text-align:right;">${n}</span>
        <i class="bi bi-star-fill text-warning"></i>
        <div class="flex-grow-1 stock-bar" style="height:6px;">
          <div class="stock-bar-fill" style="width:${dist[n]}%;"></div>
        </div>
        <span style="width:28px;">${dist[n]}%</span>
      </div>`).join('');
  }

  const reviewData = [
    { name:'Amna S.',  avatar:'rev1', text:'Absolutely stunning plant! Arrived well-packaged and healthy. Already sprouting new leaves.', rating:5, date:'2 weeks ago' },
    { name:'Bilal K.', avatar:'rev2', text:'Exactly as described. My living room looks transformed. Great value for the quality.',         rating:5, date:'1 month ago' },
    { name:'Hira M.',  avatar:'rev3', text:'Good quality, took a week to settle in but now thriving. Care card was super helpful.',        rating:4, date:'1 month ago' },
    { name:'Usman R.', avatar:'rev4', text:'Beautiful plant, fast delivery. Lost one small leaf in transit but otherwise perfect.',         rating:4, date:'2 months ago' },
  ];
  if (revList) {
    revList.innerHTML = reviewData.map(r => `
      <div class="review-card reveal in">
        <div class="d-flex align-items-center gap-3 mb-2">
          <img src="https://picsum.photos/seed/${r.avatar}${p.id}/80/80" class="reviewer-avatar" alt="${r.name}">
          <div>
            <strong class="d-block">${r.name}</strong>
            <span class="review-stars">${stars(r.rating)}</span>
            <span class="text-muted small ms-1">${r.date}</span>
          </div>
          <span class="badge ms-auto rounded-pill" style="background:rgba(76,175,80,.12);color:var(--dark-green);font-size:.7rem;">Verified</span>
        </div>
        <p class="mb-0 text-muted">${r.text}</p>
      </div>`).join('');
  }
}

