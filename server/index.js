// ═══════════════════════════════════════════════
// AURA Botanicals — Express Server
// ═══════════════════════════════════════════════
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const db      = require('./database');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// helper: next ID
function nextId(table) {
  const ids = db.get('_nextId').value();
  const id  = ids[table] || 1;
  db.set(`_nextId.${table}`, id + 1).write();
  return id;
}

// ── PRODUCTS ──────────────────────────────────
app.get('/api/products', (req, res) => {
  res.json({ success: true, data: db.get('products').value() });
});

app.get('/api/products/:id', (req, res) => {
  const p = db.get('products').find({ id: parseInt(req.params.id) }).value();
  if (!p) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, data: p });
});

// ── CART ──────────────────────────────────────
app.get('/api/cart', (req, res) => {
  const cartItems = db.get('cart').value();
  const products  = db.get('products').value();
  const items = cartItems.map(ci => {
    const prod = products.find(p => p.id === ci.product_id) || {};
    return { ...ci, name: prod.name, price: prod.price, color_top: prod.color_top };
  });
  const total = items.reduce((s, i) => s + (i.price || 0) * i.quantity, 0);
  res.json({ success: true, data: items, total: total.toFixed(2) });
});

app.post('/api/cart', (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  if (!product_id) return res.status(400).json({ success: false, message: 'product_id required' });
  const prod = db.get('products').find({ id: parseInt(product_id) }).value();
  if (!prod) return res.status(404).json({ success: false, message: 'Product not found' });

  const existing = db.get('cart').find({ product_id: parseInt(product_id) }).value();
  if (existing) {
    db.get('cart').find({ product_id: parseInt(product_id) })
      .assign({ quantity: existing.quantity + quantity }).write();
  } else {
    db.get('cart').push({ id: nextId('cart'), product_id: parseInt(product_id), quantity, added_at: new Date().toISOString() }).write();
  }
  res.json({ success: true, message: `${prod.name} added to cart` });
});

app.delete('/api/cart/:id', (req, res) => {
  db.get('cart').remove({ id: parseInt(req.params.id) }).write();
  res.json({ success: true, message: 'Item removed' });
});

app.delete('/api/cart', (req, res) => {
  db.set('cart', []).write();
  res.json({ success: true, message: 'Cart cleared' });
});

// ── NEWSLETTER ────────────────────────────────
app.post('/api/newsletter', (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@'))
    return res.status(400).json({ success: false, message: 'Valid email required' });

  const existing = db.get('newsletter').find({ email }).value();
  if (existing) return res.json({ success: true, message: 'Already subscribed!' });

  db.get('newsletter').push({ id: nextId('newsletter'), email, created_at: new Date().toISOString() }).write();
  res.json({ success: true, message: 'Subscribed! Welcome to the garden.' });
});

app.get('/api/newsletter', (req, res) => {
  const subs = db.get('newsletter').value();
  res.json({ success: true, data: subs, count: subs.length });
});

// ── CONTACT ───────────────────────────────────
app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message)
    return res.status(400).json({ success: false, message: 'All fields required' });

  db.get('contact').push({
    id: nextId('contact'), name, email, message, created_at: new Date().toISOString()
  }).write();
  res.json({ success: true, message: "Message received. We'll bloom back soon." });
});

app.get('/api/contact', (req, res) => {
  res.json({ success: true, data: db.get('contact').value() });
});

// ── TESTIMONIALS ──────────────────────────────
app.get('/api/testimonials', (req, res) => {
  res.json({ success: true, data: db.get('testimonials').value() });
});

// ── INGREDIENTS ───────────────────────────────
app.get('/api/ingredients', (req, res) => {
  res.json({ success: true, data: db.get('ingredients').value() });
});

// ── CATCH ALL → frontend ──────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🌿 AURA Botanicals running at http://localhost:${PORT}`);
  console.log(`   Press Ctrl+C to stop\n`);
});
