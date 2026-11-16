const list = document.getElementById('list');

if (!getToken()) window.location.href = 'login.html?next=orders.html';

async function loadOrders() {
  try {
    const orders = await api('/api/orders');

    if (orders.length === 0) {
      list.innerHTML = `
        <div class="card" style="text-align:center">
          <p>You haven't placed any orders yet.</p>
          <a href="index.html"><button>Start shopping</button></a>
        </div>`;
      return;
    }

    orders.forEach((order) => {
      const card = document.createElement('div');
      card.className = 'card order';

      const date = new Date(order.created_at.replace(' ', 'T') + 'Z').toLocaleString();

      const head = document.createElement('div');
      head.className = 'order-head';
      const left = document.createElement('strong');
      left.textContent = `Order #${order.id}`;
      const status = document.createElement('span');
      status.className = 'status';
      status.textContent = order.status;
      head.append(left, status);

      const dateEl = document.createElement('div');
      dateEl.className = 'muted';
      dateEl.textContent = date;

      const ul = document.createElement('ul');
      order.items.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = `${item.name} × ${item.qty} · ${money(item.price * item.qty)}`;
        ul.appendChild(li);
      });

      const total = document.createElement('div');
      total.innerHTML = '<strong></strong>';
      total.firstChild.textContent = `Total: ${money(order.total)}`;

      const addr = document.createElement('div');
      addr.className = 'muted';
      addr.textContent = `Deliver to: ${order.address}`;

      card.append(head, dateEl, ul, total, addr);
      list.appendChild(card);
    });
  } catch (err) {
    list.textContent = err.message;
  }
}

loadOrders();
