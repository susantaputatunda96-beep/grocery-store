const content = document.getElementById('content');
let allProducts = [];

async function init() {
  const res = await fetch('/api/products');
  allProducts = await res.json();
  render();
}

function render() {
  const cart = getCart();
  const lines = allProducts
    .filter((p) => cart[p.id])
    .map((p) => ({ product: p, qty: cart[p.id] }));

  content.innerHTML = '';

  if (lines.length === 0) {
    content.innerHTML = `
      <div class="card" style="text-align:center">
        <p>Your cart is empty.</p>
        <a href="index.html"><button>Start shopping</button></a>
      </div>`;
    return;
  }

  const total = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);

  const layout = document.createElement('div');
  layout.className = 'cart-layout';

  const itemsCard = document.createElement('div');
  itemsCard.className = 'card';

  lines.forEach(({ product, qty }) => {
    const row = document.createElement('div');
    row.className = 'cart-row';

    const emoji = document.createElement('div');
    emoji.className = 'emoji';
    emoji.textContent = product.emoji;

    const info = document.createElement('div');
    info.className = 'info';
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = product.name;
    const unit = document.createElement('div');
    unit.className = 'unit';
    unit.textContent = `${product.unit} · ${money(product.price)}`;
    info.append(name, unit);

    const stepper = document.createElement('div');
    stepper.className = 'stepper';
    const minus = document.createElement('button');
    minus.className = 'secondary';
    minus.textContent = '−';
    minus.setAttribute('aria-label', `Remove one ${product.name}`);
    minus.addEventListener('click', () => { changeQty(product.id, -1); render(); });
    const count = document.createElement('span');
    count.textContent = qty;
    const plus = document.createElement('button');
    plus.textContent = '+';
    plus.setAttribute('aria-label', `Add one ${product.name}`);
    plus.addEventListener('click', () => { changeQty(product.id, 1); render(); });
    stepper.append(minus, count, plus);

    const lineTotal = document.createElement('div');
    lineTotal.className = 'line-total';
    lineTotal.textContent = money(product.price * qty);

    row.append(emoji, info, stepper, lineTotal);
    itemsCard.appendChild(row);
  });
  
  const summary = document.createElement('div');
  summary.className = 'card';
  summary.innerHTML = `
    <div class="summary-row"><span>Items</span><span>${lines.reduce((s, l) => s + l.qty, 0)}</span></div>
    <div class="summary-row total"><span>Total</span><span>${money(total)}</span></div>
    <label for="address">Delivery address</label>
    <textarea id="address" placeholder="House no, street, city, PIN code"></textarea>
    <p class="error" id="error"></p>
    <button class="big" id="order-btn"></button>
  `;

  layout.append(itemsCard, summary);
  content.appendChild(layout);

  const orderBtn = document.getElementById('order-btn');
  const errorEl = document.getElementById('error');

  if (!getToken()) {
    orderBtn.textContent = 'Log in to place order';
    orderBtn.addEventListener('click', () => {
      window.location.href = 'login.html?next=cart.html';
    });
    return;
  }

  orderBtn.textContent = 'Place order';
  orderBtn.addEventListener('click', async () => {
    errorEl.textContent = '';
    const address = document.getElementById('address').value;
    const items = lines.map((l) => ({ id: l.product.id, qty: l.qty }));

    try {
      orderBtn.disabled = true;
      await api('/api/orders', { method: 'POST', body: JSON.stringify({ address, items }) });
      saveCart({});
      window.location.href = 'orders.html';
    } catch (err) {
      errorEl.textContent = err.message;
      orderBtn.disabled = false;
    }
  });
}

init();
