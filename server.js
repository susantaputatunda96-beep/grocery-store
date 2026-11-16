const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Middleware: checks the login token ----------
function requireLogin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please log in.' });

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
}

// ---------- Auth ----------
app.post('/api/signup', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password || password.length < 6) {
    return res.status(400).json({ error: 'Enter an email and a password of at least 6 characters.' });
  }

  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return res.status(400).json({ error: 'That email is already registered.' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)').run(email, hash);

  const token = jwt.sign({ id: Number(result.lastInsertRowid), email }, SECRET, { expiresIn: '7d' });
  res.json({ token });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user || !bcrypt.compareSync(password || '', user.password)) {
    return res.status(401).json({ error: 'Wrong email or password.' });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: '7d' });
  res.json({ token });
});

// ---------- Products (public) ----------
app.get('/api/categories', (req, res) => {
  const rows = db.prepare('SELECT DISTINCT category FROM products ORDER BY category').all();
  res.json(rows.map((r) => r.category));
});

app.get('/api/products', (req, res) => {
  const q = (req.query.q || '').trim();
  const category = (req.query.category || '').trim();

  let sql = 'SELECT * FROM products WHERE 1 = 1';
  const params = [];

  if (q) {
    sql += ' AND name LIKE ?';
    params.push(`%${q}%`);
  }
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  sql += ' ORDER BY category, name';

  res.json(db.prepare(sql).all(...params));
});

// ---------- Orders (need login) ----------
app.post('/api/orders', requireLogin, (req, res) => {
  const { address, items } = req.body;

  if (!address || !address.trim()) {
    return res.status(400).json({ error: 'Enter a delivery address.' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Your cart is empty.' });
  }

  // Look up real prices on the server. Never trust prices sent from the browser.
  const getProduct = db.prepare('SELECT * FROM products WHERE id = ?');
  const lines = [];
  let total = 0;

  for (const item of items) {
    const id = Number(item.id);
    const qty = Number(item.qty);
    if (!Number.isInteger(id) || !Number.isInteger(qty) || qty < 1 || qty > 20) {
      return res.status(400).json({ error: 'Invalid item in cart.' });
    }
    const product = getProduct.get(id);
    if (!product) return res.status(400).json({ error: 'An item in your cart no longer exists.' });

    lines.push({ product, qty });
    total += product.price * qty;
  }

  try {
    db.exec('BEGIN');
    const order = db
      .prepare('INSERT INTO orders (user_id, address, total) VALUES (?, ?, ?)')
      .run(req.user.id, address.trim(), total);

    const insertItem = db.prepare(
      'INSERT INTO order_items (order_id, name, price, qty) VALUES (?, ?, ?, ?)'
    );
    for (const line of lines) {
      insertItem.run(order.lastInsertRowid, line.product.name, line.product.price, line.qty);
    }
    db.exec('COMMIT');

    res.status(201).json({ id: Number(order.lastInsertRowid), total });
  } catch (err) {
    db.exec('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Could not place the order. Try again.' });
  }
});

app.get('/api/orders', requireLogin, (req, res) => {
  const orders = db
    .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC')
    .all(req.user.id);
  const getItems = db.prepare('SELECT name, price, qty FROM order_items WHERE order_id = ?');

  res.json(orders.map((o) => ({ ...o, items: getItems.all(o.id) })));
});

app.listen(PORT, () => console.log(`Running at http://localhost:${PORT}`));
