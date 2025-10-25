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

// Llamar la función al cargar la página
document.addEventListener("DOMContentLoaded", includeHTML);
