const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT0sJF1AoB0R70IHr5PvzPb2lnX8tq-XpePmyi5BpA1k_poc8hH6BBAe3d7RkwtMu-j5oDf4i-tlra5/pub?output=csv' + Date.now(); // Замени на публичную ссылку, если нужно
let products = [];
let cart = [];

// Загрузка CSV
Papa.parse(CSV_URL, {
  download: true,
  header: true,
  complete: function(results) {
    products = results.data.map(p => ({
      id: p.id,
      name: p.name,
      model: p.model,
      price: parseInt(p.price),
      designer: p.designer.split(',').map(s => s.trim()),
      silhouette: p.silhouette.split(',').map(s => s.trim()),
      color: p.color.split(',').map(s => s.trim()),
      sizes: p.sizes.split(',').map(s => s.trim()),
      category: p.category.trim(),
      image: p.image,
      description: p.description
    }));

    renderProducts();
    generateFilters(); // ← Автоматически создаём фильтры
  },
  error: function() {
    document.getElementById('products').innerHTML = '<p style="color:red;">Ошибка загрузки товаров.</p>';
  }
});

// Генерация опций фильтров
function generateFilters() {
  const allDesigners = [...new Set(products.flatMap(p => p.designer))];
  const allSilhouettes = [...new Set(products.flatMap(p => p.silhouette))];
  const allColors = [...new Set(products.flatMap(p => p.color))];
  const allSizes = [...new Set(products.flatMap(p => p.sizes))].sort();

  populateSelect('filter-designer', allDesigners);
  populateSelect('filter-silhouette', allSilhouettes);
  populateSelect('filter-color', allColors);
  populateSelect('filter-size', allSizes);
}

// Заполняет select уникальными значениями
function populateSelect(id, values) {
  const select = document.getElementById(id);
  const firstOption = select.querySelector('option'); // "Все"
  select.innerHTML = '';
  select.appendChild(firstOption);

  values.forEach(value => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

// Рендер товаров
function renderProducts(list = products) {
  const container = document.getElementById('products');
  if (list.length === 0) {
    container.innerHTML = '<p>По вашему запросу ничего не найдено.</p>';
    return;
  }

  container.innerHTML = list.map(p => `
    <div class="product-card">
      <img src="${p.image}" alt="${p.name}">
      <div class="product-info">
        <h3>${p.name} <small>(${p.model})</small></h3>
        <p><strong>${p.designer.join(', ')}</strong></p>
        <p>${p.silhouette.join(', ')}</p>
        <p>Цвет: ${p.color.join(', ')}</p>
        <p><strong>${p.price.toLocaleString()} ₽</strong></p>
        <p>Размеры: ${p.sizes.join(', ')}</p>
        <button class="add-to-cart" onclick="selectSize('${p.id}')">Выбрать размер</button>
      </div>
    </div>
  `).join('');
}

// Выбор размера
function selectSize(productId) {
  const product = products.find(p => p.id === productId);
  const selectedSize = prompt(
    `Выберите размер:\nДоступные: ${product.sizes.join(', ')}`,
    ''
  );

  if (!selectedSize || !product.sizes.includes(selectedSize.trim())) {
    alert('Размер не доступен или введён неверно.');
    return;
  }

  const size = selectedSize.trim();
  const cartId = `${productId}-${size}`;
  const existing = cart.find(item => item.cartId === cartId);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      cartId, id: product.id, name: product.name, model: product.model,
      price: product.price, size, image: product.image, quantity: 1
    });
  }

  updateCart();
  alert(`Товар добавлен: ${product.name}, размер ${size}`);
}

// Обновление корзины
function updateCart() {
  const el = document.getElementById('cart-items');
  const totalEl = document.getElementById('total');

  if (cart.length === 0) {
    el.innerHTML = 'Корзина пуста';
    totalEl.textContent = '0';
    return;
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  el.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div>${item.name} (${item.model}), размер ${item.size} × ${item.quantity}</div>
      <div>${(item.price * item.quantity).toLocaleString()} ₽</div>
    </div>
  `).join('');

  totalEl.textContent = total.toLocaleString();
}

// Форма заявки
function showForm() {
  if (cart.length === 0) {
    alert('Добавьте хотя бы одно платье в корзину!');
    return;
  }
  document.getElementById('order-form').style.display = 'block';
}

function hideForm() {
  document.getElementById('order-form').style.display = 'none';
}

document.getElementById('checkout-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const data = new FormData(this);
  const order = {
    customer: Object.fromEntries(data),
    items: cart,
    total: cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
  };

  console.log('Заявка:', order);
  alert(`Спасибо, ${order.customer.name}! Мы свяжемся с вами по телефону.`);
  cart = [];
  updateCart();
  this.reset();
  hideForm();
});

// Фильтрация
function applyFilters() {
  const designer = document.getElementById('filter-designer').value;
  const silhouette = document.getElementById('filter-silhouette').value;
  const color = document.getElementById('filter-color').value;
  const size = document.getElementById('filter-size').value;
  const minPrice = parseInt(document.getElementById('price-min').value) || 0;
  const maxPrice = parseInt(document.getElementById('price-max').value) || Infinity;

  const filtered = products.filter(p => {
    const matchDesigner = !designer || p.designer.includes(designer);
    const matchSilhouette = !silhouette || p.silhouette.includes(silhouette);
    const matchColor = !color || p.color.includes(color);
    const matchSize = !size || p.sizes.includes(size);
    const matchPrice = p.price >= minPrice && p.price <= maxPrice;
    return matchDesigner && matchSilhouette && matchColor && matchSize && matchPrice;
  });

  renderProducts(filtered);
}

// Сброс фильтров
function resetFilters() {
  document.getElementById('filter-designer').value = '';
  document.getElementById('filter-silhouette').value = '';
  document.getElementById('filter-color').value = '';
  document.getElementById('filter-size').value = '';
  document.getElementById('price-min').value = '';
  document.getElementById('price-max').value = '';
  renderProducts();
}
