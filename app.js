
const form = document.getElementById("search-form");
const input = document.getElementById("pokemon-name");
const container = document.getElementById("pokemon-container");
const message = document.getElementById("message");
const searchButton = document.getElementById("search-button");
const installButton = document.getElementById("install-button");
let installPrompt = null;

// Mostrar una acción propia cuando el navegador ofrece la instalación.
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  installButton.hidden = false;
});

installButton.addEventListener("click", async () => {
  if (!installPrompt) return;

  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  installButton.hidden = true;
});

window.addEventListener("appinstalled", () => {
  installPrompt = null;
  installButton.hidden = true;
});

const typeColors = {
  fire: "#ff795b",
  water: "#60a5fa",
  grass: "#65d995",
  electric: "#facc65",
  psychic: "#f783c6",
  ice: "#67dce3",
  dragon: "#a78bfa",
  dark: "#a1a1aa",
  fairy: "#f9a8d4",
  normal: "#c4c9d4",
  fighting: "#fb7185",
  flying: "#a5b4fc",
  poison: "#c084fc",
  ground: "#d6a56c",
  rock: "#c4b18a",
  bug: "#a3c94f",
  ghost: "#9b8ade",
  steel: "#94a3b8"
};

async function showPokemon(value) {
  const query = String(value).trim().toLowerCase();

  if (!query) {
    message.textContent = "Escribe el nombre o número de un Pokémon.";
    message.classList.add("error");
    return;
  }

  searchButton.disabled = true;
  message.classList.remove("error");
  message.textContent = "Buscando Pokémon...";
  container.replaceChildren();

  try {
    const response = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("No encontramos ese Pokémon. Prueba otro nombre o número.");
      }

      throw new Error("No se pudo consultar la API. Inténtalo de nuevo.");
    }

    const pokemon = await response.json();

    const card = document.createElement("article");
    card.className = "pokemon-card";

    const mainType = pokemon.types[0].type.name;
    card.style.setProperty(
      "--pokemon-color",
      typeColors[mainType] || "#a78bfa"
    );

    const top = document.createElement("div");
    top.className = "card-top";

    const label = document.createElement("span");
    label.className = "card-label";
    label.textContent = "POKÉMON DESCUBIERTO";

    const number = document.createElement("span");
    number.className = "pokemon-number";
    number.textContent = `#${String(pokemon.id).padStart(3, "0")}`;

    top.append(label, number);

    const visual = document.createElement("div");
    visual.className = "pokemon-visual";

    const image = document.createElement("img");
    image.className = "pokemon-image";
    image.alt = `Pokémon ${pokemon.name}`;

    image.src =
      pokemon.sprites.other?.["official-artwork"]?.front_default ||
      pokemon.sprites.front_default ||
      "";

    visual.appendChild(image);

    const name = document.createElement("h2");
    name.className = "pokemon-name";
    name.textContent = pokemon.name;

    const types = document.createElement("div");
    types.className = "type-list";

    pokemon.types.forEach(({ type }) => {
      const badge = document.createElement("span");
      badge.className = "type-badge";
      badge.textContent = type.name;
      types.appendChild(badge);
    });

    const stats = document.createElement("div");
    stats.className = "stats-grid";

    const details = [
      ["Altura", `${pokemon.height / 10} m`],
      ["Peso", `${pokemon.weight / 10} kg`],
      ["Experiencia base", pokemon.base_experience ?? "N/D"],
      [
        "Habilidades",
        pokemon.abilities.map(item => item.ability.name).join(", ")
      ]
    ];

    details.forEach(([labelText, value]) => {
      const box = document.createElement("div");
      box.className = "stat-box";

      const statLabel = document.createElement("span");
      statLabel.className = "stat-label";
      statLabel.textContent = labelText;

      const statValue = document.createElement("div");
      statValue.className = "stat-value";
      statValue.textContent = value;

      box.append(statLabel, statValue);
      stats.appendChild(box);
    });

    card.append(top, visual, name, types, stats);
    container.appendChild(card);

    message.textContent = "¡Pokémon encontrado! ✨";
  } catch (error) {
    message.textContent = error.message;
    message.classList.add("error");
  } finally {
    searchButton.disabled = false;
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  showPokemon(input.value);
});

// Botones de ejemplo del encabezado
document.querySelectorAll("[data-pokemon]").forEach((button) => {
  button.addEventListener("click", () => {
    input.value = button.dataset.pokemon;
    showPokemon(button.dataset.pokemon);
  });
});

// Registrar el Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./serviceworker.js")
      .catch((error) => {
        console.error("Error registrando el Service Worker:", error);
      });
  });
}
