/* =========================================================
   POKÉDEX DAILY
   SCRIPT.JS
   ========================================================= */


/* =========================
   CONFIGURAÇÕES
   ========================= */

const API_URL = "https://pokeapi.co/api/v2";

/*
  Atualmente a PokéAPI possui mais de 1000 Pokémon.
  Usamos 1025 como limite para contemplar os Pokémon
  disponíveis na API.
*/
const MAX_POKEMON = 1025;


/* =========================
   ELEMENTOS DA PÁGINA
   ========================= */

const elements = {

  number:
    document.getElementById("pokemon-number"),

  name:
    document.getElementById("pokemon-name"),

  types:
    document.getElementById("pokemon-types"),

  description:
    document.getElementById("pokemon-description"),

  image:
    document.getElementById("pokemon-image"),

  art:
    document.getElementById("pokemon-art"),

  spinner:
    document.getElementById("loading-spinner"),

  stats:
    document.getElementById("pokemon-stats"),

  statsTotal:
    document.getElementById("stats-total"),

  moves:
    document.getElementById("pokemon-moves"),

  curiosity:
    document.getElementById("pokemon-curiosity"),

  facts:
    document.getElementById("pokemon-facts"),

  button:
    document.getElementById("discover-button"),

  buttonText:
    document.getElementById("button-text"),

  error:
    document.getElementById("error-message")
};


/* =========================
   TRADUÇÃO DOS TIPOS
   ========================= */

const typeTranslations = {

  normal: "Normal",
  fire: "Fogo",
  water: "Água",
  electric: "Elétrico",
  grass: "Planta",
  ice: "Gelo",
  fighting: "Lutador",
  poison: "Veneno",
  ground: "Terra",
  flying: "Voador",
  psychic: "Psíquico",
  bug: "Inseto",
  rock: "Pedra",
  ghost: "Fantasma",
  dragon: "Dragão",
  dark: "Sombrio",
  steel: "Aço",
  fairy: "Fada"

};


/* =========================
   TRADUÇÃO DOS ATRIBUTOS
   ========================= */

const statTranslations = {

  hp: "HP",

  attack: "Ataque",

  defense: "Defesa",

  "special-attack":
    "Atq. Especial",

  "special-defense":
    "Def. Especial",

  speed:
    "Velocidade"

};


/* =========================
   POKÉMON ATUAL
   ========================= */

let currentPokemonId = null;


/* =========================================================
   FUNÇÕES AUXILIARES
   ========================================================= */


/*
  Gera um ID aleatório.
*/
function randomPokemonId() {

  let id;

  do {

    id =
      Math.floor(
        Math.random() * MAX_POKEMON
      ) + 1;

  } while (
    MAX_POKEMON > 1 &&
    id === currentPokemonId
  );

  return id;
}


/*
  Busca dados na PokéAPI.
*/
async function fetchData(url) {

  const response =
    await fetch(url);

  if (!response.ok) {

    throw new Error(
      "Não foi possível carregar os dados da API."
    );
  }

  return response.json();
}


/*
  Formata nomes.

  Exemplo:
  special-attack
  ↓
  Special Attack
*/
function formatName(name) {

  return name

    .split("-")

    .map(
      part =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )

    .join(" ");
}


/*
  Embaralha uma lista.
*/
function shuffle(array) {

  const result = [...array];

  for (
    let i = result.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(
        Math.random() * (i + 1)
      );

    [
      result[i],
      result[j]
    ] = [
      result[j],
      result[i]
    ];
  }

  return result;
}


/* =========================================================
   LOADING
   ========================================================= */

function setLoading(isLoading) {

  elements.button.disabled =
    isLoading;

  elements.buttonText.textContent =
    isLoading
      ? "Buscando Pokémon..."
      : "Descobrir Pokémon";

  elements.spinner.hidden =
    !isLoading;

  elements.error.hidden = true;


  if (isLoading) {

    elements.image.hidden = true;

    elements.name.textContent =
      "Carregando...";

    elements.number.textContent =
      "#---";

    elements.types.replaceChildren();


    elements.description.textContent =
      "Preparando uma nova descoberta...";


    elements.stats.innerHTML =
      `
        <div class="stat-placeholder">
          Carregando atributos...
        </div>
      `;


    elements.statsTotal.textContent =
      "—";


    elements.moves.innerHTML =
      `
        <p class="muted-message">
          Carregando ataques...
        </p>
      `;


    elements.curiosity.innerHTML =
      `
        <p>
          Buscando uma curiosidade interessante...
        </p>
      `;


    elements.facts.replaceChildren();
  }
}


/* =========================================================
   TIPOS
   ========================================================= */

function renderTypes(types) {

  elements.types.replaceChildren();

  types.forEach(item => {

    const badge =
      document.createElement("span");

    badge.className =
      "type-badge";

    badge.textContent =
      typeTranslations[item.type.name] ||
      formatName(item.type.name);

    elements.types.appendChild(badge);
  });
}


/* =========================================================
   STATUS
   ========================================================= */

function renderStats(stats) {

  elements.stats.replaceChildren();


  const total =
    stats.reduce(
      (sum, stat) =>
        sum + stat.base_stat,
      0
    );


  elements.statsTotal.textContent =
    `${total} pontos`;


  stats.forEach(stat => {

    const name =
      stat.stat.name;

    const value =
      stat.base_stat;

    const label =
      statTranslations[name] ||
      formatName(name);


    const item =
      document.createElement("div");

    item.className =
      "stat-item";


    const labelRow =
      document.createElement("div");

    labelRow.className =
      "stat-label-row";


    const statName =
      document.createElement("span");

    statName.className =
      "stat-label";

    statName.textContent =
      label;


    const statValue =
      document.createElement("span");

    statValue.className =
      "stat-value";

    statValue.textContent =
      value;


    labelRow.append(
      statName,
      statValue
    );


    const track =
      document.createElement("div");

    track.className =
      "stat-track";


    const fill =
      document.createElement("div");

    fill.className =
      "stat-fill";


    fill.style.width =
      `${Math.min(
        (value / 255) * 100,
        100
      )}%`;


    track.appendChild(fill);


    item.append(
      labelRow,
      track
    );


    elements.stats.appendChild(item);
  });
}


/* =========================================================
   ATAQUES
   ========================================================= */

function renderMoves(moves) {

  elements.moves.replaceChildren();


  /*
    Escolhe 4 ataques aleatórios.
  */
  const selectedMoves =
    shuffle(moves).slice(0, 4);


  if (
    selectedMoves.length === 0
  ) {

    const message =
      document.createElement("p");

    message.className =
      "muted-message";

    message.textContent =
      "Nenhum ataque encontrado.";

    elements.moves.appendChild(
      message
    );

    return;
  }


  selectedMoves.forEach(move => {

    const item =
      document.createElement("div");

    item.className =
      "move-item";


    const symbol =
      document.createElement("span");

    symbol.className =
      "move-symbol";

    symbol.textContent =
      "✦";

    symbol.setAttribute(
      "aria-hidden",
      "true"
    );


    const name =
      document.createElement("span");

    name.className =
      "move-name";

    name.textContent =
      formatName(
        move.move.name
      );


    item.append(
      symbol,
      name
    );


    elements.moves.appendChild(
      item
    );
  });
}


/* =========================================================
   DESCRIÇÃO
   ========================================================= */

/*
  Tenta encontrar primeiro português do Brasil,
  depois português e só então inglês.

  Isso evita que a descrição apareça em inglês
  quando existir uma versão em português.
*/
async function getDescription(
  speciesUrl
) {

  try {

    const species =
      await fetchData(speciesUrl);


    const entries =
      species.flavor_text_entries || [];


    /*
      Português do Brasil
    */
    const portugueseBrazil =
      entries.find(
        item =>
          item.language.name === "pt-br"
      );


    /*
      Português
    */
    const portuguese =
      entries.find(
        item =>
          item.language.name === "pt"
      );


    /*
      Inglês como último recurso
    */
    const english =
      entries.find(
        item =>
          item.language.name === "en"
      );


    const entry =
      portugueseBrazil ||
      portuguese ||
      english;


    if (entry) {

      return entry.flavor_text

        .replace(
          /[\n\f\r]+/g,
          " "
        )

        .replace(
          /\s+/g,
          " "
        )

        .trim();
    }


    return (
      "Uma criatura fascinante " +
      "do universo Pokémon."
    );

  } catch (error) {

    console.error(
      "Erro ao carregar a descrição:",
      error
    );


    return (
      "Explore as características " +
      "e os atributos deste Pokémon."
    );
  }
}


/* =========================================================
   ALTURA E PESO
   ========================================================= */

function renderFacts(pokemon) {

  elements.facts.replaceChildren();


  const height =
    pokemon.height / 10;

  const weight =
    pokemon.weight / 10;


  const facts = [

    {
      label: "Altura",

      value:
        `${height.toLocaleString(
          "pt-BR"
        )} m`
    },

    {
      label: "Peso",

      value:
        `${weight.toLocaleString(
          "pt-BR"
        )} kg`
    }

  ];


  facts.forEach(fact => {

    const item =
      document.createElement("div");

    item.className =
      "fact-item";


    const label =
      document.createElement("span");

    label.className =
      "fact-label";

    label.textContent =
      fact.label;


    const value =
      document.createElement("span");

    value.className =
      "fact-value";

    value.textContent =
      fact.value;


    item.append(
      label,
      value
    );


    elements.facts.appendChild(
      item
    );
  });
}


/* =========================================================
   CARREGAR POKÉMON
   ========================================================= */

async function loadPokemon(
  id = randomPokemonId()
) {

  setLoading(true);


  try {

    /*
      Busca os dados principais.
    */
    const pokemon =
      await fetchData(
        `${API_URL}/pokemon/${id}`
      );


    /*
      Busca a descrição.
    */
    const description =
      await getDescription(
        `${API_URL}/pokemon-species/${id}`
      );


    /*
      Tenta usar a arte oficial.
    */
    const imageUrl =

      pokemon.sprites.other?.[
        "official-artwork"
      ]?.front_default ||

      pokemon.sprites.other?.[
        "home"
      ]?.front_default ||

      pokemon.sprites.front_default;


    /* =========================
       NÚMERO
       ========================= */

    elements.number.textContent =
      `#${String(
        pokemon.id
      ).padStart(3, "0")}`;


    /* =========================
       NOME
       ========================= */

    elements.name.textContent =
      formatName(
        pokemon.name
      );


    /* =========================
       DESCRIÇÃO
       ========================= */

    elements.description.textContent =
      description;


    /* =========================
       TIPOS
       ========================= */

    renderTypes(
      pokemon.types
    );


    /* =========================
       STATUS
       ========================= */

    renderStats(
      pokemon.stats
    );


    /* =========================
       ATAQUES
       ========================= */

    renderMoves(
      pokemon.moves
    );


    /* =========================
       ALTURA / PESO
       ========================= */

    renderFacts(
      pokemon
    );


    /* =========================
       CURIOSIDADE
       ========================= */

    elements.curiosity.replaceChildren();


    const star =
      document.createElement("span");

    star.className =
      "curiosity-star";

    star.textContent =
      "✧";

    star.setAttribute(
      "aria-hidden",
      "true"
    );


    const text =
      document.createElement("p");

    text.textContent =
      description;


    elements.curiosity.append(
      star,
      text
    );


    /* =========================
       IMAGEM
       ========================= */

    if (imageUrl) {

      elements.image.onload =
        () => {

          elements.spinner.hidden =
            true;

          elements.image.hidden =
            false;
        };


      elements.image.onerror =
        () => {

          elements.image.hidden =
            true;

          elements.spinner.hidden =
            true;
        };


      elements.image.alt =
        `Imagem de ${formatName(
          pokemon.name
        )}`;


      elements.image.src =
        imageUrl;

    } else {

      elements.image.hidden =
        true;

      elements.spinner.hidden =
        true;
    }


    /*
      Guarda o Pokémon atual
      para evitar repetir.
    */
    currentPokemonId =
      pokemon.id;


  } catch (error) {

    console.error(
      "Erro ao carregar Pokémon:",
      error
    );


    elements.error.textContent =
      "Não foi possível carregar o Pokémon. " +
      "Verifique sua conexão e tente novamente.";


    elements.error.hidden =
      false;

  } finally {

    elements.button.disabled =
      false;

    elements.buttonText.textContent =
      "Descobrir Pokémon";

    elements.spinner.hidden =
      true;
  }
}


/* =========================================================
   BOTÃO
   ========================================================= */

elements.button.addEventListener(
  "click",
  () => {

    loadPokemon();

  }
);


/* =========================================================
   PRIMEIRO POKÉMON
   ========================================================= */

loadPokemon();