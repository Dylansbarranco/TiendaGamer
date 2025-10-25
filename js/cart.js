// ------------------ Lógica de carrito simulado ------------------
function getCart() {
  try {
    const raw = localStorage.getItem('tg_cart');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error leyendo carrito:', e);
    return [];
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem('tg_cart', JSON.stringify(cart));
    updateCartBadge();
  } catch (e) {
    console.error('Error guardando carrito:', e);
  }
}

function updateCartBadge() {
  const countEl = document.getElementById('cart-counter');
  if (!countEl) return;
  const cart = getCart();
  const totalItems = cart.reduce((s, it) => s + (it.qty || 0), 0);
  countEl.textContent = `carrito: ${String(totalItems)}`;
}

/**
 * Añade un producto al carrito por id (busca detalles en data/products.json)
 * id: string o number
 * qty: número a añadir
 */
function addToCart(id, qty = 1) {
  if (!id) return;
  const dataUrl = new URL('../data/products.json', window.location.href).href;
  fetch(dataUrl)
    .then(res => res.json())
    .then(data => {
      const products = Array.isArray(data) ? data : (data && data.productos) ? data.productos : [data];
      const prod = products.find(p => String(p.id) === String(id));
      if (!prod) {
        console.warn('Producto no encontrado para id', id);
        return;
      }

      const cart = getCart();
      const existing = cart.find(it => String(it.id) === String(id));
      if (existing) {
        existing.qty = (existing.qty || 0) + qty;
      } else {
        cart.push({ id: prod.id, nombre: prod.nombre, precio: prod.precio, imagenes: prod.imagenes || [], qty: qty });
      }
      saveCart(cart);
      // Notificación simple
      showToast(`${prod.nombre} agregado al carrito.`);
    })
    .catch(err => console.error('Error al añadir al carrito:', err));
}

function showToast(message, timeout = 2000) {
  let toast = document.getElementById('tg-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'tg-toast';
    toast.style.position = 'fixed';
    toast.style.right = '20px';
    toast.style.bottom = '20px';
    toast.style.background = '#111827';
    toast.style.color = '#fff';
    toast.style.padding = '10px 14px';
    toast.style.borderRadius = '6px';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = '1';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.style.opacity = '0'; }, timeout);
}

function renderCart(containerId = 'cart-items') {
  const container = document.getElementById(containerId);
  if (!container) return;
  const cart = getCart();
  container.innerHTML = '';
  if (cart.length === 0) {
    container.innerHTML = '<p>Tu carrito está vacío.</p>';
    const totalEl = document.getElementById('cart-total'); if (totalEl) totalEl.textContent = '';
    return;
  }

  let subtotal = 0;
  cart.forEach(item => {
    const img = (item.imagenes && item.imagenes.length) ? new URL(item.imagenes[0], window.location.href).href : new URL('../icons/placeholder.svg', window.location.href).href;
    const row = document.createElement('div');
    row.className = 'cart-row';
    row.innerHTML = `
      <div class="cart-item-media"><img src="${img}" alt="${escapeHtml(item.nombre)}" width="80"></div>
      <div class="cart-item-info">
        <strong>${escapeHtml(item.nombre)}</strong>
        <div class="cart-item-controls">
          <label>Cantidad: <input type="number" min="1" value="${item.qty || 1}" class="cart-qty" data-id="${escapeHtml(item.id)}"></label>
          <button class="btn btn-link cart-remove" data-id="${escapeHtml(item.id)}">Eliminar</button>
        </div>
      </div>
      <div class="cart-item-price">${escapeHtml((item.precio || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }))}</div>
    `;
    container.appendChild(row);
    subtotal += (item.precio || 0) * (item.qty || 1);
  });

  const totalEl = document.getElementById('cart-total');
  if (totalEl) totalEl.textContent = subtotal.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

  // Conectar listeners de cantidad y eliminar
  container.querySelectorAll('.cart-qty').forEach(input => {
    input.addEventListener('change', (e) => {
      const id = e.target.getAttribute('data-id');
      const v = Number(e.target.value) || 1;
      changeCartQuantity(id, v);
      renderCart(containerId);
    });
  });
  container.querySelectorAll('.cart-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-id');
      removeFromCart(id);
      renderCart(containerId);
    });
  });
}

function changeCartQuantity(id, qty) {
  const cart = getCart();
  const it = cart.find(i => String(i.id) === String(id));
  if (!it) return;
  it.qty = qty;
  saveCart(cart);
}

function removeFromCart(id) {
  let cart = getCart();
  cart = cart.filter(i => String(i.id) !== String(id));
  saveCart(cart);
}

function clearCart() {
  saveCart([]);
}

function checkoutSimulated() {
  // Simulación simple: vaciar carrito y mostrar mensaje
  const cart = getCart();
  if (cart.length === 0) { showToast('Tu carrito está vacío.'); return; }
  clearCart();
  renderCart();
  showToast('Compra simulada completada. ¡Gracias!');
}

// Inicializar badge y cart render si la página contiene elementos
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  if (document.getElementById('cart-items')) renderCart('cart-items');
});
