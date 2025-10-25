/*
  Loader simple: carga de forma sincrónica (XHR sync) los archivos divididos
  para mantener compatibilidad con los scripts inline en los HTML que esperan
  funciones globales (como loadCatalogProducts, addToCart, etc.).

  NOTA: usamos XHR síncrono a propósito para asegurar que las funciones estén
  disponibles inmediatamente después de ejecutar este script; esto evita tener
  que cambiar todas las referencias en los HTML (no convertimos a módulos).
*/

(function(){
  var base = (function(){
    var src = document.currentScript && document.currentScript.src;
    if (!src) return './';
    return src.replace(/[^\/]+$/, '');
  })();

  var files = [
    'includeHTML.js',
    'hero.js',
    'utils.js',
    'featured.js',
    'catalog.js',
    'cart.js'
  ];

  files.forEach(function(f){
    var path = base + f;
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', path, false); // síncrono a propósito
      xhr.send(null);
      if (xhr.status === 200 || xhr.status === 0) {
        // Evaluar en el scope global
        (0, eval)(xhr.responseText);
      } else {
        console.error('No se pudo cargar:', path, 'status:', xhr.status);
      }
    } catch (e) {
      console.error('Error cargando', path, e);
    }
  });

})();

