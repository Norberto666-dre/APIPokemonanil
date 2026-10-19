
const CACHE_NAME = "pokedex-v2";
const STATIC_CACHE = `${CACHE_NAME}-static`;
const POKEMON_CACHE = `${CACHE_NAME}-pokemon`;

const APP_FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json",
  "./images/icon-192.png",
  "./images/icon-512.png",
  "./images/icon-maskable-512.png"
];

// Instalar y guardar los archivos principales
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

// Limpiar las versiones antiguas de las cachés
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) =>
              key.startsWith("pokedex-") &&
              key !== STATIC_CACHE &&
              key !== POKEMON_CACHE
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Interceptar solicitudes
self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Solo manejar las consultas de Pokémon de PokéAPI
  const isPokemonRequest =
    url.origin === "https://pokeapi.co" &&
    /^\/api\/v2\/pokemon\/[^/]+\/?$/.test(url.pathname);

  if (isPokemonRequest) {
    event.respondWith(networkFirstPokemon(request));
    return;
  }

  // No interceptar otras APIs ni sitios externos
  if (url.origin !== self.location.origin) return;

  // Archivos de la aplicación: caché primero
  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);

  if (cached) return cached;

  return fetch(request);
}

async function networkFirstPokemon(request) {
  const cache = await caches.open(POKEMON_CACHE);

  try {
    const response = await fetch(request);

    if (response.ok) {
      await cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    const cached = await cache.match(request);

    if (cached) return cached;

    return new Response(
      JSON.stringify({
        error: "offline",
        message: "Este Pokémon no está disponible sin conexión. Conéctate a Internet para consultarlo."
      }),
      {
        status: 503,
        headers: {
          "Content-Type": "application/json; charset=utf-8"
        }
      }
    );
  }
}
