// ---- Funcionalidad: cargar y renderizar productos destacados dinámicamente ----
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
  selected.forEach(p => renderFeaturedCard(container, p));
    })
    .catch(err => {
      console.error('No se pudieron cargar los productos:', err);
      container.innerHTML = '<p class="error">No se pudieron cargar los productos destacados.</p>';
    });
}

function renderFeaturedCard(container, p) {
  const imageUrls = (p.imagenes && p.imagenes.length)
    ? p.imagenes.map(path => new URL(path, window.location.href).href)
    : [new URL('../icons/placeholder.svg', window.location.href).href];

  const price = (typeof p.precio === 'number') ? p.precio : Number(p.precio) || 0;
  const priceFormatted = price.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

  const article = document.createElement('article');
  article.className = 'producto-card';
  article.tabIndex = 0;

  let imgOffset = 0
  
  
  article.innerHTML = `
  <div class="producto-media">
  <img class="main-img" src="${imageUrls[imgOffset]}" alt="${escapeHtml(p.nombre || 'Producto')}">
  </div>
  <h3> ${escapeHtml(p.nombre || 'Sin nombre')}</h3>
  <p class="precio">${escapeHtml(priceFormatted)}</p>
  <div class="producto-actions">
  <a class="btn" href="catalogo.html?producto=${encodeURIComponent(p.id || '')}">Ver</a>
  <button class="btn add-to-cart" type="button">Agregar</button>
  </div>
  `;

  
  container.appendChild(article);
  
  let mainImg = article.querySelector(".main-img")
  mainImg.addEventListener('click', () => {
    imgOffset = (imgOffset + 1) % imageUrls.length
    mainImg.src = imageUrls[imgOffset]
  }) 

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
  loadFeaturedProducts('destacados-list', 8);
});
