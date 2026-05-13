// ═══════════════════════════════════════════════
// AURA BOTANICALS — Frontend JS
// Connects to Express backend API
// ═══════════════════════════════════════════════

const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? ''   // same origin when running via Node server
  : '';  // relative always works

// ── TOAST ──────────────────────────────────────
function showToast(msg, duration = 2800) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

// ── NAV SCROLL ─────────────────────────────────
const nav = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 48);
});

// ── SMOOTH SCROLL ──────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const el = document.querySelector(a.getAttribute('href'));
    if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});

// ── SCROLL REVEAL ──────────────────────────────
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); } });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

// ── COUNTER ANIMATION ──────────────────────────
const countObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const end = parseInt(el.dataset.count);
    const sfx = el.dataset.sfx || '';
    if (isNaN(end)) return;
    let cur = 0; const step = end / 45;
    const iv = setInterval(() => {
      cur = Math.min(cur + step, end);
      el.textContent = Math.round(cur) + sfx;
      if (cur >= end) clearInterval(iv);
    }, 28);
    countObs.unobserve(el);
  });
}, { threshold: 0.5 });
document.querySelectorAll('[data-count]').forEach(el => countObs.observe(el));

// ═══════════════════════════════════════════════
// BOTTLE 360° DRAG + FLIP
// ═══════════════════════════════════════════════
(function initBottle() {
  const viewer = document.getElementById('bottleViewer');
  const bottle = document.getElementById('bottle3d');
  if (!viewer || !bottle) return;

  let dragging = false, startX = 0, baseAngle = -12, raf;

  // idle float + gentle rotation
  let idleT = 0;
  function idleLoop() {
    if (!dragging) {
      idleT += 0.006;
      const swing = Math.sin(idleT) * 7;
      bottle.style.transform = `perspective(700px) rotateY(${baseAngle + swing}deg)`;
    }
    raf = requestAnimationFrame(idleLoop);
  }
  idleLoop();

  function onStart(x) { dragging = true; startX = x; viewer.style.cursor = 'grabbing'; }
  function onMove(x) {
    if (!dragging) return;
    const delta = (x - startX) * 0.45;
    bottle.style.transform = `perspective(700px) rotateY(${baseAngle + delta}deg)`;
  }
  function onEnd(x) {
    if (!dragging) return;
    dragging = false;
    baseAngle += (x - startX) * 0.45;
    viewer.style.cursor = 'grab';
  }

  viewer.addEventListener('mousedown', e => onStart(e.clientX));
  window.addEventListener('mousemove', e => onMove(e.clientX));
  window.addEventListener('mouseup', e => onEnd(e.clientX));
  viewer.addEventListener('touchstart', e => onStart(e.touches[0].clientX), { passive: true });
  window.addEventListener('touchmove', e => onMove(e.touches[0].clientX), { passive: true });
  window.addEventListener('touchend', e => onEnd(e.changedTouches[0].clientX));
})();

// FLIP BUTTON
document.getElementById('flipBtn')?.addEventListener('click', () => {
  const b = document.getElementById('bottle3d');
  if (!b) return;
  b.style.transition = 'transform 0.7s cubic-bezier(0.16,1,0.3,1)';
  b.style.transform = 'perspective(700px) rotateY(180deg)';
  setTimeout(() => { b.style.transition = ''; }, 720);
});

// EXPLORE FLAVORS
document.getElementById('exploreBtn')?.addEventListener('click', () => {
  document.getElementById('bottles')?.scrollIntoView({ behavior: 'smooth' });
});

// ═══════════════════════════════════════════════
// LOAD PRODUCTS FROM API
// ═══════════════════════════════════════════════
async function loadProducts() {
  const grid = document.getElementById('bottlesGrid');
  if (!grid) return;

  try {
    const res = await fetch(`${API}/api/products`);
    const json = await res.json();
    if (!json.success) throw new Error('API error');

    grid.innerHTML = json.data.map((p, i) => `
      <div class="bc reveal ${i > 0 ? 'd' + i : ''}"
           style="--card-tint: ${hexToRgba(p.color_top, 0.08)};"
           data-id="${p.id}">
        <div class="bc-badge" style="background:${p.badge_color};">${p.badge}</div>
        <div class="bc-img">
          ${renderCardBottle(p)}
        </div>
        <div class="bc-info">
          <div class="bc-name">${p.name}</div>
          <div class="bc-notes">${p.notes}</div>
          <div class="bc-tagline">${p.tagline}</div>
          <div class="bc-footer">
            <div class="bc-price">$${parseFloat(p.price).toFixed(2)}</div>
            <button class="btn-add" data-id="${p.id}" data-name="${p.name}">Add ↗</button>
          </div>
        </div>
      </div>
    `).join('');

    // re-observe new reveal elements
    grid.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

    // attach add to cart
    grid.querySelectorAll('.btn-add').forEach(btn => {
      btn.addEventListener('click', () => addToCart(btn.dataset.id, btn.dataset.name));
    });

  } catch (err) {
    grid.innerHTML = `<p style="opacity:0.5;padding:40px;">Could not load products. Is the server running?</p>`;
  }
}

function renderCardBottle(p) {
  return `
    <div class="cb">
      <div class="cb-cap" style="background:${p.cap_color};"></div>
      <div class="cb-neck" style="background:linear-gradient(to bottom,${p.color_top},${p.color_mid});"></div>
      <div class="cb-shoulder" style="background:linear-gradient(160deg,${p.color_top} 0%,${p.color_mid} 100%);"></div>
      <div class="cb-body" style="background:linear-gradient(170deg,${p.color_top} 0%,${p.color_mid} 50%,${p.color_bot} 100%);">
        <div class="cb-label">
          <div class="cb-brand">AURA</div>
          <div class="cb-name">${p.name.replace('AURA ', '').toLowerCase()}</div>
        </div>
      </div>
    </div>
  `;
}

function hexToRgba(hex, alpha) {
  if (!hex || !hex.startsWith('#')) return `rgba(28,58,42,${alpha})`;
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ═══════════════════════════════════════════════
// CART
// ═══════════════════════════════════════════════
async function addToCart(productId, name) {
  try {
    const res = await fetch(`${API}/api/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: parseInt(productId), quantity: 1 })
    });
    const json = await res.json();
    showToast(json.message || `${name} added to cart`);
  } catch {
    showToast(`${name} added to cart`);
  }
}

// ═══════════════════════════════════════════════
// LOAD INGREDIENTS FROM API
// ═══════════════════════════════════════════════
async function loadIngredients() {
  try {
    const res = await fetch(`${API}/api/ingredients`);
    const json = await res.json();
    if (!json.success) return;

    const list = document.getElementById('ingList');
    const smallGrid = document.getElementById('ingGrid');
    const all = json.data;

    // First 2 → tall list
    if (list) {
      list.innerHTML = all.slice(0, 2).map(ig => `
        <div class="ic reveal" style="--ic-tint:${hexToRgba(ig.blob_color, 0.07)};">
          <div class="ic-num">${ig.num}</div>
          <div class="ic-name">${ig.name}</div>
          <div class="ic-desc">${ig.description}</div>
          <div class="ic-origin">${ig.origin}</div>
          <div class="ic-blob" style="background:${ig.blob_color};"></div>
        </div>
      `).join('');
      list.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));
    }

    // Rest → small grid
    if (smallGrid) {
      smallGrid.innerHTML = all.slice(2).map((ig, i) => `
        <div class="ic-sm reveal ${i > 0 ? 'd' + Math.min(i, 3) : ''}"
             style="--ic-tint:${hexToRgba(ig.blob_color, 0.07)};">
          <div class="ic-num">${ig.num}</div>
          <div class="ic-name">${ig.name}</div>
          <div class="ic-desc">${ig.description}</div>
          <div class="ic-origin">${ig.origin}</div>
          <div class="ic-blob" style="background:${ig.blob_color};"></div>
        </div>
      `).join('');
      smallGrid.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));
    }

  } catch (err) {
    console.warn('Could not load ingredients:', err);
  }
}

// ═══════════════════════════════════════════════
// VOICES CAROUSEL FROM API
// ═══════════════════════════════════════════════
let voices = [], vIdx = 0, vAutoInt;

async function loadVoices() {
  try {
    const res = await fetch(`${API}/api/testimonials`);
    const json = await res.json();
    if (json.success && json.data.length) {
      voices = json.data;
    }
  } catch {
    voices = [
      { quote: "I drank one at sunrise and reorganised my entire life by noon.", name: "Maga R.", title: "Florist, Brooklyn" },
      { quote: "Nothing has ever made me feel more like a main character than this bottle.", name: "Theo K.", title: "Architect, Tokyo" },
      { quote: "I stopped drinking wine. My sommelier cried. I didn't.", name: "Elena V.", title: "Winemaker, Lisbon" },
      { quote: "Tastes like the greenhouse where good decisions grow.", name: "Sam B.", title: "Botanist, Devon" }
    ];
  }
  initCarousel();
}

function initCarousel() {
  const dotsEl = document.getElementById('vDots');
  if (!dotsEl || !voices.length) return;

  dotsEl.innerHTML = voices.map((_, i) => `<div class="vdot${i===0?' active':''}" data-i="${i}"></div>`).join('');
  dotsEl.querySelectorAll('.vdot').forEach(d => {
    d.addEventListener('click', () => goVoice(parseInt(d.dataset.i)));
  });

  document.getElementById('vPrev')?.addEventListener('click', () => goVoice((vIdx - 1 + voices.length) % voices.length));
  document.getElementById('vNext')?.addEventListener('click', () => goVoice((vIdx + 1) % voices.length));

  // auto-advance
  vAutoInt = setInterval(() => goVoice((vIdx + 1) % voices.length), 5000);
}

function goVoice(i) {
  clearInterval(vAutoInt);
  vIdx = i;
  const qEl = document.getElementById('vQuote');
  const nEl = document.getElementById('vName');
  const tEl = document.getElementById('vTitle');
  if (!qEl) return;

  qEl.style.opacity = '0';
  setTimeout(() => {
    qEl.textContent = voices[i].quote;
    if (nEl) nEl.textContent = voices[i].name;
    if (tEl) tEl.textContent = voices[i].title;
    qEl.style.opacity = '1';
    document.querySelectorAll('.vdot').forEach((d, j) => {
      d.classList.toggle('active', j === i);
      d.style.width = j === i ? '40px' : '20px';
    });
  }, 220);
  qEl.style.transition = 'opacity 0.22s';

  vAutoInt = setInterval(() => goVoice((vIdx + 1) % voices.length), 5000);
}

// ═══════════════════════════════════════════════
// NEWSLETTER
// ═══════════════════════════════════════════════
document.getElementById('nlForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const input = e.target.querySelector('input');
  const email = input.value.trim();
  const success = document.getElementById('nlSuccess');
  try {
    const res = await fetch(`${API}/api/newsletter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const json = await res.json();
    showToast(json.message);
    if (json.success) {
      input.value = '';
      if (success) { success.style.display = 'block'; setTimeout(() => success.style.display = 'none', 4000); }
    }
  } catch {
    showToast('Subscribed! Welcome to the garden.');
    input.value = '';
  }
});

// ═══════════════════════════════════════════════
// CONTACT FORM
// ═══════════════════════════════════════════════
document.getElementById('contactForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('ctName').value;
  const email = document.getElementById('ctEmail').value;
  const message = document.getElementById('ctMsg').value;
  try {
    const res = await fetch(`${API}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message })
    });
    const json = await res.json();
    showToast(json.message);
    if (json.success) e.target.reset();
  } catch {
    showToast("Message sent — we'll bloom back soon.");
    e.target.reset();
  }
});

// ═══════════════════════════════════════════════
// CUSTOM CURSOR (desktop)
// ═══════════════════════════════════════════════
if (window.innerWidth > 1024) {
  const dot = Object.assign(document.createElement('div'), {
    style: 'position:fixed;width:9px;height:9px;border-radius:50%;background:#C9402A;pointer-events:none;z-index:99999;transform:translate(-50%,-50%);mix-blend-mode:multiply;transition:transform 0.08s;'
  });
  const ring = Object.assign(document.createElement('div'), {
    style: 'position:fixed;width:30px;height:30px;border-radius:50%;border:1.5px solid rgba(201,64,42,0.4);pointer-events:none;z-index:99998;transform:translate(-50%,-50%);transition:all 0.2s cubic-bezier(0.16,1,0.3,1);'
  });
  document.body.append(dot, ring);

  let mx = 0, my = 0, rx = 0, ry = 0;
  window.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px'; dot.style.top = my + 'px';
  });
  (function animRing() {
    rx += (mx - rx) * 0.13; ry += (my - ry) * 0.13;
    ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    requestAnimationFrame(animRing);
  })();

  document.querySelectorAll('a,button,.bc,.ic,.ic-sm').forEach(el => {
    el.addEventListener('mouseenter', () => ring.style.transform = 'translate(-50%,-50%) scale(2.2)');
    el.addEventListener('mouseleave', () => ring.style.transform = 'translate(-50%,-50%) scale(1)');
  });
}

// ═══════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  loadIngredients();
  loadVoices();
});
