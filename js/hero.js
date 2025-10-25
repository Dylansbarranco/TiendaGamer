(function () {
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
