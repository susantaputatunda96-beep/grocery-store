function getToken() {
  return localStorage.getItem('token');
}

function logout() {
  localStorage.removeItem('token');
  window.location.href = 'index.html';
}

function money(amount) {
  return '₹' + amount;
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem('cart')) || {};
  } catch (err) {
    return {};
  }
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

function changeQty(productId, change) {
  const cart = getCart();
  const qty = (cart[productId] || 0) + change;
  if (qty <= 0) delete cart[productId];
  else cart[productId] = Math.min(qty, 20);
  saveCart(cart);
}

function updateCartCount() {
  const total = Object.values(getCart()).reduce((sum, qty) => sum + qty, 0);
  const badge = document.getElementById('cart-count');
  if (badge) badge.textContent = total;
}

async function api(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem('token');
    const page = location.pathname.split('/').pop() || 'index.html';
    window.location.href = `login.html?next=${page}`;
    throw new Error('Please log in.');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

function renderHeader() {
  const header = document.getElementById('header');
  if (!header) return;

  header.innerHTML = `
    <div class="bar">
      <a class="brand" href="index.html">GreenBasket</a>
      <form class="search" action="index.html">
        <input type="search" name="q" placeholder="Search groceries" aria-label="Search groceries" />
      </form>
      <nav>
        <a href="orders.html">My orders</a>
        <a href="cart.html">Cart <span class="badge" id="cart-count">0</span></a>
        <a href="login.html" id="auth-link">Log in</a>
      </nav>
    </div>
  `;

  const authLink = document.getElementById('auth-link');
  if (getToken()) {
    authLink.textContent = 'Log out';
    authLink.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }
  updateCartCount();
}

renderHeader();
