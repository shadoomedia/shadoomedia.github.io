document.addEventListener('DOMContentLoaded', async function () {
  const loadingElement = document.getElementById('loading');
  const pokemonContainer = document.getElementById('pokemonContainer');
  const pokemonListElement = document.getElementById('pokemonList');
  const loadingTextElement = document.getElementById('loadingText');

  let offset = 0;
  let isFetching = false;
  const pokemonLimit = 1017; // Set the desired limit

  async function fetchPokemonWithPagination() {
      if (isFetching || offset >= pokemonLimit) {
          return;
      }

      try {
          isFetching = true;

          const remainingPokemon = pokemonLimit - offset;
          const pageResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/?offset=${offset}&limit=${remainingPokemon}`);
          const pageData = await pageResponse.json();

          const pokemonItems = [];
          const pokemonPromises = pageData.results.map(pokemon => fetch(pokemon.url).then(response => response.json()));
          const pokemonDataArray = await Promise.all(pokemonPromises);

          for (let i = 0; i < pageData.results.length; i++) {
              const pokemonData = pokemonDataArray[i];
              const listItem = `
                  <li class="col-12 col-sm-3 col-md-4 col-lg-2">
                      <div class="card loaded">
                          <img src="${pokemonData.sprites.front_default}" class="card-img-top loaded" alt="${pokemonData.name}">
                          <div class="card-body">
                              <h5 class="card-title">${pokemonData.name}</h5>
                              <p class="card-text">ID: ${pokemonData.id}</p>
                              <div class="card-description loading">...</div>
                          </div>
                      </div>
                  </li>
              `;
              pokemonItems.push(listItem);
          }

          pokemonListElement.insertAdjacentHTML('beforeend', pokemonItems.join(''));

          loadingTextElement.textContent = `Loaded ${Math.min(offset + pageData.results.length, pokemonLimit)} of ${pokemonLimit}`;
          offset += pageData.results.length;
      } catch (error) {
          console.error('Error fetching Pokémon data:', error);
          loadingElement.innerHTML = 'Error loading Pokémon data';
      } finally {
          isFetching = false;
      }
  }

  function isContainerScrollAt80Percent() {
      const scrollPosition = pokemonContainer.scrollTop + pokemonContainer.clientHeight;
      const totalHeight = pokemonContainer.scrollHeight;
      return scrollPosition / totalHeight >= 0.8 && offset < pokemonLimit;
  }

  async function handleInfiniteScroll() {
      if (isContainerScrollAt80Percent()) {
          await fetchPokemonWithPagination();
      }
  }

  pokemonContainer.addEventListener('scroll', handleInfiniteScroll);

  pokemonListElement.addEventListener('click', function (event) {
      const card = event.target.closest('.card');
      if (card) {
          const isFlipped = card.classList.contains('flipped');

          if (isFlipped) {
              const cardDescriptionElement = card.querySelector('.card-description');
              cardDescriptionElement.innerHTML = '...';
              cardDescriptionElement.classList.remove('loaded');
          }

          card.classList.toggle('flipped');

          if (!isFlipped) {
              const pokemonId = card.querySelector('.card-text').textContent.split(': ')[1];
              const cardDescriptionElement = card.querySelector('.card-description');
              cardDescriptionElement.classList.add('loading');

              fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`)
                  .then(response => response.json())
                  .then(data => {
                      const description = data.flavor_text_entries.find(entry => entry.language.name === 'en').flavor_text;
                      cardDescriptionElement.innerHTML = description;
                      cardDescriptionElement.classList.remove('loading');
                      cardDescriptionElement.classList.add('loaded');
                  })
                  .catch(error => {
                      console.error('Error fetching Pokemon description:', error);
                      cardDescriptionElement.innerHTML = 'Error loading description';
                  });
          }
      }
  });

  await fetchPokemonWithPagination();

  pokemonListElement.classList.add('loaded');
  pokemonContainer.classList.add('loaded');
  loadingElement.style.display = 'none';
});
