document.addEventListener('DOMContentLoaded', async function () {
  const loadingElement = document.getElementById('loading');
  const pokemonContainer = document.getElementById('pokemonContainer');
  const pokemonListElement = document.getElementById('pokemonList');
  const loadingTextElement = document.getElementById('loadingText');

  let offset = 0;
  let isFetching = false;
  const pokemonLimit = 1017; // Set the desired limit

  // Function to fetch data for Pokémon with pagination
  async function fetchPokemonWithPagination() {
    if (isFetching || offset >= pokemonLimit) {
      return; // If a fetch operation is already in progress or the limit is reached, do nothing
    }

    try {
      isFetching = true; // Set the flag to indicate that a fetch operation is starting

      const remainingPokemon = pokemonLimit - offset;
      const pageResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/?offset=${offset}&limit=${remainingPokemon}`);
      const pageData = await pageResponse.json();

      // Array to store HTML strings
      const pokemonItems = [];

      // Fetch detailed information for each Pokémon on the page concurrently
      const pokemonPromises = pageData.results.map(pokemon => fetch(pokemon.url).then(response => response.json()));
      const pokemonDataArray = await Promise.all(pokemonPromises);

      // Build HTML strings for each Pokémon
      for (let i = 0; i < pageData.results.length; i++) {
        const pokemonData = pokemonDataArray[i];
        const listItem = `
          <li class="col-12 col-sm-6 col-md-4 col-lg-3">
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

      // Join and append HTML strings
      pokemonListElement.insertAdjacentHTML('beforeend', pokemonItems.join(''));

      // Update loading text and offset
      loadingTextElement.textContent = `Loaded ${Math.min(offset + pageData.results.length, pokemonLimit)} of ${pokemonLimit}`;
      offset += pageData.results.length;
    } catch (error) {
      console.error('Error fetching Pokémon data:', error);
      loadingElement.innerHTML = 'Error loading Pokémon data';
    } finally {
      isFetching = false; // Reset the fetch flag, regardless of success or failure
    }
  }

  // Function to check if the user has scrolled to 80% of the container height
  function isContainerScrollAt80Percent() {
    const scrollPosition = pokemonContainer.scrollTop + pokemonContainer.clientHeight;
    const totalHeight = pokemonContainer.scrollHeight;
    return scrollPosition / totalHeight >= 0.8 && offset < pokemonLimit;
  }

  // Function to handle loading when scrolled to 80% of the container height
  async function handleInfiniteScroll() {
    if (isContainerScrollAt80Percent()) {
      await fetchPokemonWithPagination();
    }
  }

  // Event listener for infinite scrolling on the container
  pokemonContainer.addEventListener('scroll', handleInfiniteScroll);

  // Event listener to handle card click and toggle the 'flipped' class
  pokemonListElement.addEventListener('click', function (event) {
    const card = event.target.closest('.card');
    if (card) {
      // Check if the card is already flipped
      const isFlipped = card.classList.contains('flipped');

      // If the back face is visible, hide the Pokemon description (retract)
      if (isFlipped) {
        const cardDescriptionElement = card.querySelector('.card-description');
        cardDescriptionElement.innerHTML = '...';
        cardDescriptionElement.classList.remove('loaded'); // Remove loaded class
      }

      // Toggle the 'flipped' class
      card.classList.toggle('flipped');

      // If the back face is now visible, fetch and display the Pokemon description (expand)
      if (!isFlipped) {
        const pokemonId = card.querySelector('.card-text').textContent.split(': ')[1];
        const cardDescriptionElement = card.querySelector('.card-description');
        cardDescriptionElement.classList.add('loading'); // Show loading text

        fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`)
          .then(response => response.json())
          .then(data => {
            const description = data.flavor_text_entries.find(entry => entry.language.name === 'en').flavor_text;
            cardDescriptionElement.innerHTML = description;
            cardDescriptionElement.classList.remove('loading'); // Remove loading text
            cardDescriptionElement.classList.add('loaded'); // Mark description as loaded
          })
          .catch(error => {
            console.error('Error fetching Pokemon description:', error);
            cardDescriptionElement.innerHTML = 'Error loading description';
          });
      }
    }
  });

  // Call the function to fetch the initial Pokémon data
  await fetchPokemonWithPagination();

  // Update container styles after fetching is complete
  pokemonListElement.classList.add('loaded'); // Add 'loaded' class to update styles
  pokemonContainer.classList.add('loaded'); // Add 'loaded' class to update styles
  loadingElement.style.display = 'none'; // Hide loading animation
});
