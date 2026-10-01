/* ==========================================================================
   VERDANT — auth.js
   LocalStorage-based registration, login, session, dashboard.
   ========================================================================== */

(function (V) {
  'use strict';

  /* ===== REGISTER ===== */
  const regForm = V.qs('#registerForm');
  if (regForm) {
    const fields = {
      name:     regForm.querySelector('#regName'),
      email:    regForm.querySelector('#regEmail'),
      password: regForm.querySelector('#regPassword'),
      confirm:  regForm.querySelector('#regConfirm')
    };

    // Password strength meter
    fields.password && fields.password.addEventListener('input', function () {
      const val = this.value;
      const bar  = V.qs('#strengthBar');
      const text = V.qs('#strengthText');
      if (!bar) return;
      let score = 0;
      if (val.length >= 8)            score++;
      if (/[A-Z]/.test(val))          score++;
      if (/[0-9]/.test(val))          score++;
      if (/[^A-Za-z0-9]/.test(val))  score++;
      const map = ['', 'Weak', 'Fair', 'Good', 'Strong'];
      const cls = ['', 'bg-danger', 'bg-warning', 'bg-info', 'bg-success'];
      bar.style.width  = (score * 25) + '%';
      bar.className    = 'progress-bar ' + (cls[score] || '');
      if (text) text.textContent = map[score] || '';
    });

    // Toggle password visibility
    V.qsa('.toggle-pw').forEach(btn => btn.addEventListener('click', function () {
      const inp = this.previousElementSibling;
      if (!inp) return;
      const isText = inp.type === 'text';
      inp.type = isText ? 'password' : 'text';
      this.querySelector('i').className = isText ? 'bi bi-eye' : 'bi bi-eye-slash';
    }));

    regForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clearErrors();

      const name     = fields.name.value.trim();
      const email    = fields.email.value.trim().toLowerCase();
      const password = fields.password.value;
      const confirm  = fields.confirm.value;

      let valid = true;
      if (!name)                       { showError('regName', 'Full name is required'); valid = false; }
      if (!email || !isValidEmail(email)) { showError('regEmail', 'Enter a valid email'); valid = false; }
      if (password.length < 6)         { showError('regPassword', 'Password must be at least 6 characters'); valid = false; }
      if (password !== confirm)        { showError('regConfirm', 'Passwords do not match'); valid = false; }
      if (!valid) return;

      const users = V.getJSON(V.KEYS.USERS, []);
      if (users.find(u => u.email === email)) {
        showError('regEmail', 'This email is already registered');
        return;
      }

      users.push({ id: Date.now(), name, email, password, avatar: '', createdAt: new Date().toISOString() });
      V.setJSON(V.KEYS.USERS, users);
      V.toast('Account created! Please Login.', 'success');
      setTimeout(() => location.href = '/Login.html', 900);
    });
  }

  /* ===== LOGIN ===== */
  // const loginForm = V.qs('#LoginForm');
  // if (loginForm) {
  //   V.qsa('.toggle-pw').forEach(btn => btn.addEventListener('click', function () {
  //     const inp = this.previousElementSibling;
  //     if (!inp) return;
  //     inp.type = inp.type === 'text' ? 'password' : 'text';
  //     this.querySelector('i').className = inp.type === 'text' ? 'bi bi-eye-slash' : 'bi bi-eye';
  //   }));

  //   loginForm.addEventListener('submit', function (e) {
  //     e.preventDefault();
  //     clearErrors();
  //     const email    = loginForm.querySelector('#loginEmail').value.trim().toLowerCase();
  //     const password = loginForm.querySelector('#loginPassword').value;

  //       console.log('Email:', email);   // ← add karo
  // console.log('Password:', password); // ← add karo
  //     const remember = loginForm.querySelector('#rememberMe')?.checked;

  //     if (!email)    { showError('loginEmail', 'Email is required'); return; }
  //     if (!password) { showError('loginPassword', 'Password is required'); return; }

  //     const users = V.getJSON(V.KEYS.USERS, []);
  //     const user  = users.find(u => u.email === email && u.password === password);
  //     console.log('User found:', user); // ← add karo
  //     if (!user) {
  //       V.toast('Invalid email or password', 'error');
  //       return;
  //     }

  //     const session = { id: user.id, name: user.name, email: user.email, avatar: user.avatar || '' };
  //     V.setJSON(V.KEYS.CURRENT_USER, session);
  //     if (remember) localStorage.setItem('verdant_rememberEmail', email);
  //     else localStorage.removeItem('verdant_rememberEmail');

  //     V.toast(`Welcome back, ${user.name}! 🌿`, 'success');
  //     setTimeout(() => location.href = 'dashboard.html', 800);
  //   });
  /* ===== LOGIN ===== */
const loginForm = document.getElementById('loginForm');

if (loginForm) {

  // Toggle password visibility
  document.querySelectorAll('.toggle-pw').forEach(btn => {
    btn.addEventListener('click', function () {
      const inp = this.previousElementSibling;
      if (!inp) return;
      inp.type = inp.type === 'text' ? 'password' : 'text';
      this.querySelector('i').className = inp.type === 'text' ? 'bi bi-eye-slash' : 'bi bi-eye';
    });
  });

  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    e.stopPropagation();

    const email    = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    const remember = document.getElementById('rememberMe')?.checked;

    // Validation
    if (!email) {
      document.getElementById('loginEmail').classList.add('is-invalid');
      return;
    }
    if (!password) {
      document.getElementById('loginPassword').classList.add('is-invalid');
      return;
    }

    // Check user
    const users = JSON.parse(localStorage.getItem('verdant_users') || '[]');
    const user  = users.find(u => u.email === email && u.password === password);

    if (!user) {
      alert('Invalid email or password');
      return;
    }

    // Save session
    const session = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || ''
    };
    localStorage.setItem('verdant_currentUser', JSON.stringify(session));

    if (remember) {
      localStorage.setItem('verdant_rememberEmail', email);
    } else {
      localStorage.removeItem('verdant_rememberEmail');
    }

    alert('Welcome ' + user.name + '!');

    // Redirect
    window.location.href = 'dashboard.html';
  });
}

    // Pre-fill remembered email
  //   const remembered = localStorage.getItem('verdant_rememberEmail');
  //   if (remembered) {
  //     const inp = loginForm.querySelector('#loginEmail');
  //     if (inp) { inp.value = remembered; loginForm.querySelector('#rememberMe').checked = true; }
  //   }
  // }

  /* ===== DASHBOARD ===== */
  const dashWrap = V.qs('#dashboardWrap');
  if (dashWrap) {
    const user = V.getJSON(V.KEYS.CURRENT_USER, null);
    if (!user) { location.href = '/Login.html'; return; }

    V.qs('#dashName')  && (V.qs('#dashName').textContent  = user.name);
    V.qs('#dashEmail') && (V.qs('#dashEmail').textContent = user.email);
    V.qs('#dashInitial') && (V.qs('#dashInitial').textContent = user.name.charAt(0).toUpperCase());

    // Cart count
    const cart = V.getJSON(V.KEYS.CART, []);
    const wishlist = V.getJSON(V.KEYS.WISHLIST, []);
    V.qs('#dashCartCount') && (V.qs('#dashCartCount').textContent = cart.reduce((s,i) => s + i.qty, 0));
    V.qs('#dashWishCount') && (V.qs('#dashWishCount').textContent = wishlist.length);

    // Edit profile
    const editForm = V.qs('#editProfileForm');
    if (editForm) {
      editForm.querySelector('#editName').value  = user.name;
      editForm.querySelector('#editEmail').value = user.email;

      editForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const newName  = editForm.querySelector('#editName').value.trim();
        const newEmail = editForm.querySelector('#editEmail').value.trim().toLowerCase();
        if (!newName || !isValidEmail(newEmail)) { V.toast('Please fill in valid details', 'error'); return; }

        const users = V.getJSON(V.KEYS.USERS, []);
        const idx   = users.findIndex(u => u.id === user.id);
        if (idx > -1) { users[idx].name = newName; users[idx].email = newEmail; V.setJSON(V.KEYS.USERS, users); }

        user.name = newName; user.email = newEmail;
        V.setJSON(V.KEYS.CURRENT_USER, user);
        V.qs('#dashName').textContent  = newName;
        V.qs('#dashEmail').textContent = newEmail;
        V.qs('#dashInitial').textContent = newName.charAt(0).toUpperCase();
        V.toast('Profile updated successfully', 'success');
      });
    }

    // Wishlist preview
    const wlPreview = V.qs('#dashWishlistPreview');
    if (wlPreview) {
      if (!wishlist.length) {
        wlPreview.innerHTML = '<p class="text-muted small">Your wishlist is empty. <a href="Pages/Shop.html">Browse plants</a></p>';
      } else {
        wlPreview.innerHTML = wishlist.slice(0, 4).map(item => `
          <div class="d-flex align-items-center gap-3 py-2 border-bottom">
            <img src="${item.image}" class="rounded-3" style="width:52px;height:52px;object-fit:cover;" alt="${item.name}">
            <div class="flex-grow-1">
              <div class="fw-semibold small">${item.name}</div>
              <div class="text-muted" style="font-size:.8rem;">${V.formatPrice(item.price)}</div>
            </div>
            <a href="Pages/Detail.html?id=${item.id}" class="btn btn-leaf btn-sm py-1">View</a>
          </div>`).join('') + (wishlist.length > 4 ? `<a href="Pages/Wishlist.html" class="btn btn-outline-leaf btn-sm mt-3">See all ${wishlist.length} saved plants</a>` : '');
      }
    }

    // Cart preview
    const cartPreview = V.qs('#dashCartPreview');
    if (cartPreview) {
      if (!cart.length) {
        cartPreview.innerHTML = '<p class="text-muted small">Your cart is empty. <a href="Pages/Shop.html">Shop now</a></p>';
      } else {
        cartPreview.innerHTML = cart.slice(0, 3).map(item => `
          <div class="d-flex align-items-center gap-3 py-2 border-bottom">
            <img src="${item.image}" class="rounded-3" style="width:52px;height:52px;object-fit:cover;" alt="${item.name}">
            <div class="flex-grow-1">
              <div class="fw-semibold small">${item.name}</div>
              <div class="text-muted" style="font-size:.8rem;">${V.formatPrice(item.price)} × ${item.qty}</div>
            </div>
          </div>`).join('') + `<a href="Pages/Cart.html" class="btn btn-leaf btn-sm mt-3">Go to Cart</a>`;
      }
    }
  }

  /* ===== HELPERS ===== */
  function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

  function showError(fieldId, msg) {
    const el = V.qs(`#${fieldId}`);
    if (!el) return;
    el.classList.add('is-invalid');
    let fb = el.nextElementSibling;
    if (!fb || !fb.classList.contains('invalid-feedback')) {
      fb = document.createElement('div');
      fb.className = 'invalid-feedback';
      el.after(fb);
    }
    fb.textContent = msg;
  }

  function clearErrors() {
    V.qsa('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
  }

})(window.VERDANT);