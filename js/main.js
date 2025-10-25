/**
 * Reemplaza el contenido de los elementos del DOM que tengan el atributo `data-include`
 * por el contenido obtenido del archivo indicado en ese atributo.
 *
 * Comportamiento:
 * - Selecciona todos los elementos con el selector `[data-include]`.
 * - Para cada elemento obtiene la ruta del atributo `data-include` y realiza una petición
 *   con `fetch`.
 * - Si la petición tiene éxito, inserta el texto recibido en `element.innerHTML`.
 * - Si ocurre un error (red, CORS, archivo no encontrado, etc.), asigna
 *   `"Error cargando archivo"` a `element.innerHTML`.
 *
 * Notas:
 * - La función dispara operaciones asíncronas (usa la Fetch API) pero no devuelve una
 *   promesa; las actualizaciones del DOM se realizan cuando cada petición completa.
 * - Conviene llamarla después de que el DOM esté cargado (por ejemplo, en `DOMContentLoaded`).
 * - Las rutas en `data-include` deben ser accesibles desde el origen de la página o permitir CORS.
 *
 * @function includeHTML
 * @returns {void} No devuelve ningún valor; modifica el DOM de forma asíncrona.
 * @example
 * // HTML: <div data-include="/partials/header.html"></div>
 * includeHTML();
 */
function includeHTML() {
  const includes = document.querySelectorAll('[data-include]');
  includes.forEach(el => {
    const file = el.getAttribute('data-include');
    fetch(file)
      .then(res => res.text())
      .then(data => el.innerHTML = data)
      .catch(err => el.innerHTML = "Error cargando archivo");
  });
}

(() => {
    // Selección de elementos de fondo por id.
    // Si algún elemento no existe, se mantendrá como null en el array.
    const backgrounds = [
        document.getElementById("hero-bg1"),
        document.getElementById("hero-bg2"),
        document.getElementById("hero-bg3"),
        document.getElementById("hero-bg4"),
        document.getElementById("hero-bg5"),
    ]

    // Filtramos elementos nulos para evitar errores posteriores.
    const validBackgrounds = backgrounds.filter(Boolean)

    // Si no hay fondos válidos, salimos (nada que animar).
    if (validBackgrounds.length === 0) return

    // Índice del fondo actualmente visible
    let currentIndex = 0

    // Aseguramos estado inicial: todos opacos 0 excepto el primero (si existe)
    validBackgrounds.forEach((bg, idx) => {
        bg.style.transition = "opacity 0.8s ease" // transición suave de fade
        bg.style.opacity = idx === currentIndex ? "1" : "0"
        bg.style.pointerEvents = "none" // evitar interacción accidental
    })

    // Cada 5 segundos se alterna entre fondos
    setInterval(() => {
        // Fade out del fondo actual
        validBackgrounds[currentIndex].style.opacity = "0"

        // Avanza al siguiente fondo (con wrap-around)
        currentIndex = (currentIndex + 1) % validBackgrounds.length

        // Fade in del siguiente fondo
        validBackgrounds[currentIndex].style.opacity = "1"
    }, 5000)
})()


// Llamar la función al cargar la página
document.addEventListener("DOMContentLoaded", includeHTML);

// ---- Funcionalidad: cargar y renderizar productos destacados dinámicamente ----
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Carga productos y selecciona los destacados.
 * Si existen productos con `destacado: true`, se usan primero.
 * Si no, se eligen aleatoriamente del catálogo.
 */
function loadFeaturedProducts(containerId = 'destacados-list', limit = 4) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const dataUrl = new URL('../data/products.json', window.location.href).href;

  fetch(dataUrl)
    .then(res => {
      if (!res.ok) throw new Error('HTTP error ' + res.status);
      return res.json();
    })
    .then(data => {
      let products = Array.isArray(data) ? data : (data && data.productos) ? data.productos : [data];

      // Priorizar productos marcados como destacado
      const destacados = products.filter(p => p && p.destacado === true);
      let selected = [];
      if (destacados.length > 0) {
        selected = destacados.slice(0, limit);
      } else {
        // Si no hay destacados, elegir aleatoriamente del catálogo
        selected = shuffleArray(products).slice(0, limit);
      }

      // Renderizar los productos seleccionados
      container.innerHTML = '';
      selected.forEach(p => renderProductCard(container, p));
    })
    .catch(err => {
      console.error('No se pudieron cargar los productos:', err);
      container.innerHTML = '<p class="error">No se pudieron cargar los productos destacados.</p>';
    });
}

function renderProductCard(container, p) {
  const imageUrls = (p.imagenes && p.imagenes.length)
    ? p.imagenes.map(path => new URL(path, window.location.href).href)
    : [new URL('../icons/placeholder.svg', window.location.href).href];

  const price = (typeof p.precio === 'number') ? p.precio : Number(p.precio) || 0;
  const priceFormatted = price.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

  const article = document.createElement('article');
  article.className = 'producto-card';
  article.tabIndex = 0;

  const thumbnailsHtml = imageUrls.map((u, i) => `
      <button class="thumb" data-src="${u}" aria-label="Ver imagen ${i+1}" type="button">
        <img src="${u}" alt="${escapeHtml(p.nombre || 'Producto')} miniatura ${i+1}">
      </button>
  `).join('');

  article.innerHTML = `
    <div class="producto-media">
      <img class="main-img" src="${imageUrls[0]}" alt="${escapeHtml(p.nombre || 'Producto')}">
      <div class="thumbnails">${thumbnailsHtml}</div>
    </div>
    <h3>${escapeHtml(p.nombre || 'Sin nombre')}</h3>
    <p class="precio">${escapeHtml(priceFormatted)}</p>
    <div class="producto-actions">
      <a class="btn" href="catalogo.html?producto=${encodeURIComponent(p.id || '')}">Ver</a>
      <button class="btn add-to-cart" type="button">Agregar</button>
    </div>
  `;

  container.appendChild(article);

  const thumbs = article.querySelectorAll('.thumb');
  const mainImg = article.querySelector('.main-img');
  thumbs.forEach(btn => {
    btn.addEventListener('click', () => {
      const src = btn.getAttribute('data-src');
      if (mainImg && src) {
        mainImg.src = src;
        mainImg.alt = `${escapeHtml(p.nombre || 'Producto')}`;
      }
    });
  });

  // Conectar botón Agregar al carrito
  const addBtn = article.querySelector('.add-to-cart');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      addToCart(String(p.id || ''), 1);
    });
  }
}

// Carga los productos destacados una vez cargado el DOM
document.addEventListener('DOMContentLoaded', () => {
  loadFeaturedProducts('destacados-list', 3);
});

// ---- Funcionalidad: cargar y filtrar catálogo completo ----
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name) || '';
}

function populateCategoryFilter(selectId, products) {
  const select = document.getElementById(selectId);
  if (!select) return;
  // Obtener categorías únicas
  const cats = Array.from(new Set((products || []).map(p => p && p.categoria).filter(Boolean))).sort();
  // Limpiar opciones (mantener la opción 'Todas')
  const current = select.value || '';
  select.innerHTML = '<option value="">Todas las categorías</option>' + cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  if (current) select.value = current;
}

function applyCatalogFilters(products, search, category) {
  const q = (search || '').trim().toLowerCase();
  return (products || []).filter(p => {
    if (!p) return false;
    if (category && category !== '' && String(p.categoria) !== String(category)) return false;
    if (q === '') return true;
    return String(p.nombre || '').toLowerCase().includes(q) || String(p.categoria || '').toLowerCase().includes(q);
  });
}

function loadCatalogProducts(containerId = 'catalog-list') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const dataUrl = new URL('../data/products.json', window.location.href).href;

  fetch(dataUrl)
    .then(res => {
      if (!res.ok) throw new Error('HTTP error ' + res.status);
      return res.json();
    })
    .then(data => {
      const products = Array.isArray(data) ? data : (data && data.productos) ? data.productos : [data];

      // Poblar filtro de categorías
      populateCategoryFilter('categoria-filter', products);

      // Leer valores iniciales desde query string o controles
      const urlCategory = getQueryParam('categoria') || '';
      const urlSearch = getQueryParam('q') || '';

      const searchInput = document.getElementById('search-input');
      const categorySelect = document.getElementById('categoria-filter');
      const clearBtn = document.getElementById('clear-filters');

      if (searchInput && urlSearch) searchInput.value = decodeURIComponent(urlSearch);
      if (categorySelect && urlCategory) categorySelect.value = decodeURIComponent(urlCategory);

      // Función que actualiza la vista según filtros
      function updateView() {
        const s = searchInput ? searchInput.value : '';
        const c = categorySelect ? categorySelect.value : '';
        const filtered = applyCatalogFilters(products, s, c);
        container.innerHTML = '';
        if (filtered.length === 0) {
          container.innerHTML = '<p class="muted">No se encontraron productos.</p>';
          return;
        }
        filtered.forEach(p => renderProductCard(container, p));
      }

      // Listeners
      if (searchInput) {
        let timer;
        searchInput.addEventListener('input', () => {
          clearTimeout(timer);
          timer = setTimeout(updateView, 200);
        });
      }

      if (categorySelect) categorySelect.addEventListener('change', updateView);
      if (clearBtn) clearBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (categorySelect) categorySelect.value = '';
        updateView();
      });

      // Mostrar vista inicial
      updateView();
    })
    .catch(err => {
      console.error('Error cargando catálogo:', err);
      container.innerHTML = '<p class="error">No se pudo cargar el catálogo.</p>';
    });
}

// Inicializar catálogo si la página tiene el contenedor
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('catalog-list')) {
    // Llamada principal: carga todos los productos y conecta filtros
    loadCatalogProducts('catalog-list');
  }
});

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
  const countEl = document.getElementById('cart-count');
  if (!countEl) return;
  const cart = getCart();
  const totalItems = cart.reduce((s, it) => s + (it.qty || 0), 0);
  countEl.textContent = String(totalItems);
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

