const { DatabaseSync } = require('node:sqlite');

const db = new DatabaseSync('grocery.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit TEXT NOT NULL,
    price INTEGER NOT NULL,
    emoji TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    address TEXT NOT NULL,
    total INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'Placed',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    qty INTEGER NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );
`);

const products = [
  
  ['Bananas', 'Fruits', '1 dozen', 60, '🍌'],
  ['Apples', 'Fruits', '1 kg', 180, '🍎'],
  ['Oranges', 'Fruits', '1 kg', 90, '🍊'],
  ['Grapes', 'Fruits', '500 g', 70, '🍇'],
  ['Mangoes', 'Fruits', '1 kg', 150, '🥭'],
  ['Watermelon', 'Fruits', '1 piece', 80, '🍉'],
  ['Pineapple', 'Fruits', '1 piece', 70, '🍍'],

  ['Tomatoes', 'Vegetables', '1 kg', 40, '🍅'],
  ['Potatoes', 'Vegetables', '1 kg', 30, '🥔'],
  ['Onions', 'Vegetables', '1 kg', 35, '🧅'],
  ['Carrots', 'Vegetables', '500 g', 30, '🥕'],
  ['Broccoli', 'Vegetables', '1 piece', 60, '🥦'],
  ['Spinach', 'Vegetables', '1 bunch', 20, '🥬'],
  ['Green chillies', 'Vegetables', '100 g', 15, '🌶️'],
  ['Sweet corn', 'Vegetables', '2 pieces', 30, '🌽'],
  ['Brinjal', 'Vegetables', '500 g', 30, '🍆'],

  ['Milk', 'Dairy & Eggs', '1 L', 66, '🥛'],
  ['Eggs', 'Dairy & Eggs', '12 pieces', 84, '🥚'],
  ['Butter', 'Dairy & Eggs', '100 g', 58, '🧈'],
  ['Cheese', 'Dairy & Eggs', '200 g', 130, '🧀'],
  ['Curd', 'Dairy & Eggs', '500 g', 45, '🥣'],

  ['Bread', 'Bakery', '400 g', 45, '🍞'],
  ['Croissants', 'Bakery', '2 pieces', 80, '🥐'],
  ['Cookies', 'Bakery', '200 g', 40, '🍪'],

  ['Basmati rice', 'Staples', '1 kg', 120, '🍚'],
  ['Wheat flour', 'Staples', '5 kg', 250, '🌾'],
  ['Toor dal', 'Staples', '1 kg', 160, '🫘'],
  ['Sugar', 'Staples', '1 kg', 48, '🍬'],
  ['Salt', 'Staples', '1 kg', 22, '🧂'],
  ['Cooking oil', 'Staples', '1 L', 150, '🫒'],

  ['Potato chips', 'Snacks & Drinks', '150 g', 40, '🍟'],
  ['Chocolate', 'Snacks & Drinks', '100 g', 90, '🍫'],
  ['Tea', 'Snacks & Drinks', '250 g', 120, '🍵'],
  ['Coffee', 'Snacks & Drinks', '100 g', 180, '☕'],
  ['Orange juice', 'Snacks & Drinks', '1 L', 110, '🧃'],
  ['Mineral water', 'Snacks & Drinks', '1 L', 20, '💧'],
];

const { n } = db.prepare('SELECT COUNT(*) AS n FROM products').get();
if (n === 0) {
  const insert = db.prepare(
    'INSERT INTO products (name, category, unit, price, emoji) VALUES (?, ?, ?, ?, ?)'
  );
  for (const p of products) insert.run(...p);
}

module.exports = db;
