const input = document.getElementById('inputBusqueda');
const btn = document.getElementById('btnBuscar');
const contenedor = document.getElementById('contenedor');

// Postres "destacados" de la pastelería (se cargan al inicio)
const POSTRES_DESTACADOS = [
  'cheesecake', 'brownie', 'tiramisu', 'apple pie', 'chocolate cake', 'carrot cake'
];

// Mostrar estado de carga
function mostrarCargando() {
  contenedor.innerHTML = `
    <div class="estado" style="grid-column: 1/-1;">
      <div class="spinner"></div>
      <p>Cargando delicias...</p>
    </div>
  `;
}

// Mostrar mensaje de error
function mostrarError(mensaje) {
  contenedor.innerHTML = `
    <div class="estado error" style="grid-column: 1/-1;">
      <p>😕 ${mensaje}</p>
    </div>
  `;
}

// Renderizar una tarjeta de postre
function renderizarPostre(receta) {
  return `
    <div class="postre-card">
      <img src="${receta.strMealThumb}" alt="${receta.strMeal}" loading="lazy" />
      <div class="postre-info">
        <h3>${receta.strMeal}</h3>
        <span class="categoria">${receta.strCategory}</span>
        <p class="origen">📍 Origen: ${receta.strArea}</p>
        <p class="descripcion">${receta.strInstructions.substring(0, 120)}...</p>
      </div>
    </div>
  `;
}

// Buscar postres por nombre (TheMealDB usa inglés)
async function buscarPostres(termino) {
  mostrarCargando();
  try {
    const response = await fetch(
      `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(termino.trim())}`
    );

    if (!response.ok) {
      throw new Error('No se pudo conectar con la API de recetas.');
    }

    const data = await response.json();

    // TheMealDB devuelve { meals: null } si no hay resultados
    if (!data.meals || data.meals.length === 0) {
      mostrarError(`No encontramos "${termino}". Prueba con otro nombre `);
      return;
    }

    // Mostrar resultados
    contenedor.innerHTML = data.meals.map(renderizarPostre).join('');
  } catch (error) {
    mostrarError(error.message);
  }
}

// Cargar postres destacados al iniciar
async function cargarDestacados() {
  mostrarCargando();
  try {
    // Hacemos varias peticiones en paralelo para los destacados
    const promesas = POSTRES_DESTACADOS.map(nombre =>
      fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${nombre}`)
        .then(res => res.ok ? res.json() : null)
        .catch(() => null)
    );

    const resultados = await Promise.all(promesas);

    // Extraer la primera receta de cada respuesta (pueden venir varias)
    const recetas = resultados
      .filter(data => data && data.meals && data.meals.length > 0)
      .map(data => data.meals[0]);

    if (recetas.length === 0) {
      mostrarError('No se pudieron cargar los postres destacados. Intenta buscar uno manualmente.');
      return;
    }

    contenedor.innerHTML = recetas.map(renderizarPostre).join('');
  } catch (error) {
    mostrarError('Error al cargar el catálogo inicial.');
  }
}

// Eventos
btn.addEventListener('click', () => {
  const termino = input.value.trim();
  if (!termino) {
    // Si está vacío, recargar destacados
    cargarDestacados();
    return;
  }
  buscarPostres(termino);
});

// Permitir buscar con Enter
input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    btn.click();
  }
});

// Cargar al inicio
cargarDestacados();