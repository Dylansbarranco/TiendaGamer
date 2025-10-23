/**
 * Carga productos desde `data/products.json` y renderiza tarjetas dentro del contenedor indicado.
 * - Soporta que el JSON sea un array de productos o un único objeto.
 * - Cada producto puede tener: id, nombre, precio, categoria, imagenes (array).
 * - Usa la primera imagen si existe; si no, usa el fallback `../icons/placeholder.svg`.
 * @param {string} containerId Id del contenedor donde insertar las tarjetas
 * @param {number} limit Número máximo de productos a mostrar
 */
function loadFeaturedProducts(containerId = 'destacados-list', limit = 4) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Construir URL relativa correcta a data/products.json desde la ubicación actual
  const dataUrl = new URL('../data/products.json', window.location.href).href;

  fetch(dataUrl)
    .then(res => {
      if (!res.ok) throw new Error('HTTP error ' + res.status);
      return res.json();
    })
    .then(data => {
      let products = [];
      if (Array.isArray(data)) products = data;
      else if (data && typeof data === 'object') {
        // Si es un objeto único que representa un producto, envuélvelo en array
        // También puede ser un objeto con una propiedad como "productos" — detectamos eso
        if (Array.isArray(data.productos)) products = data.productos;
        else products = [data];
      }

      // Limitar y renderizar
      products.slice(0, limit).forEach(p => {
        // Preparar rutas absolutas de todas las imágenes del producto
        const imageUrls = (p.imagenes && p.imagenes.length)
          ? p.imagenes.map(path => new URL(path, window.location.href).href)
          : [new URL('../icons/placeholder.svg', window.location.href).href];

        const price = (typeof p.precio === 'number') ? p.precio : Number(p.precio) || 0;
        const priceFormatted = price.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

        const article = document.createElement('article');
        article.className = 'producto-card';
        article.tabIndex = 0;

        // HTML con imagen principal y miniaturas (si hay más de 1 imagen)
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
          <a class="btn" href="../html/catalogo.html?producto=${encodeURIComponent(p.id || '')}">Comprar</a>
        `;

        // Añadir el artículo al DOM y luego conectar los handlers de miniaturas
        container.appendChild(article);

        // Delegar clicks en miniaturas dentro de este artículo
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
      });
    })
    .catch(err => {
      console.error('No se pudieron cargar los productos:', err);
      container.innerHTML = '<p class="error">No se pudieron cargar los productos destacados.</p>';
    });
}

// Pequeña función para escapar texto antes de inyectarlo en innerHTML
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Cargar productos destacados cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  // Llamamos la función con el id usado en `html/index.html`
  loadFeaturedProducts('destacados-list', 4);
});
