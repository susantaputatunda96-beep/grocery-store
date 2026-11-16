const params = new URLSearchParams(window.location.search);
const query = params.get('q') || '';
let activeCategory = params.get('category') || '';
let products = [];

const grid = document.getElementById('grid');
const chips = document.getElementById('chips');
const title = document.getElementById('title');

document.querySelector('.search input').value = query;

async function loadCategories() {
  const res = await fetch('/api/categories');
  const categories = await res.json();

  chips.innerHTML = '';
  ['', ...categories].forEach((category) => {
    const chip = document.createElement('button');
    chip.className = 'chip' + (category === activeCategory ? ' active' : '');
    chip.textContent = category || 'All';
    chip.addEventListener('click', () => {
      activeCategory = category;
      loadCategories();
      loadProducts();
    });
    chips.appendChild(chip);
  });
}

async function loadProducts() {
  const search = new URLSearchParams();
  if (query) search.set('q', query);
  if (activeCategory) search.set('category', activeCategory);

  const res = await fetch('/api/products?' + search.toString());
  products = await res.json();

  title.textContent = query ? `Results for "${query}"` : 'Fresh groceries';
  render();
}

function render() {
  grid.innerHTML = '';

  if (products.length === 0) {
    grid.innerHTML = '<p class="empty">No products found. Try a different search.</p>';
    return;
  }

  const cart = getCart();

  products.forEach((product) => {
    const card = document.createElement('div');
    card.className = 'product';

    const emoji = document.createElement('div');
    emoji.className = 'emoji';
    emoji.textContent = product.emoji;

    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = product.name;

    const unit = document.createElement('div');
    unit.className = 'unit';
    unit.textContent = product.unit;

    const row = document.createElement('div');
    row.className = 'row';

    const price = document.createElement('span');
    price.className = 'price';
    price.textContent = money(product.price);
    row.appendChild(price);

    const qty = cart[product.id] || 0;

    if (qty === 0) {
      const add = document.createElement('button');
      add.textContent = 'Add';
      add.addEventListener('click', () => {
        changeQty(product.id, 1);
        render();
      });
      row.appendChild(add);
    } else {
      const stepper = document.createElement('div');
      stepper.className = 'stepper';

      const minus = document.createElement('button');
      minus.className = 'secondary';
      minus.textContent = '−';
      minus.setAttribute('aria-label', `Remove one ${product.name}`);
      minus.addEventListener('click', () => {
        changeQty(product.id, -1);
        render();
      });

      const count = document.createElement('span');
      count.textContent = qty;

      const plus = document.createElement('button');
      plus.textContent = '+';
      plus.setAttribute('aria-label', `Add one ${product.name}`);
      plus.addEventListener('click', () => {
        changeQty(product.id, 1);
        render();
      });

      stepper.append(minus, count, plus);
      row.appendChild(stepper);
    }

    card.append(emoji, name, unit, row);
    grid.appendChild(card);
  });
}

loadCategories();
loadProducts();
