// ---- Funcionalidad: cargar y filtrar catálogo completo ----
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
  filtered.forEach(p => renderCatalogCard(container, p));
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

// Render específico para tarjetas de catálogo (diferente a las de destacados)
function renderCatalogCard(container, p) {
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
