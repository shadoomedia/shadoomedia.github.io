    document.addEventListener('DOMContentLoaded', async function () {
      const loadingElement = document.getElementById('loading');
      const pokemonContainer = document.getElementById('pokemonContainer');
      const pokemonListElement = document.getElementById('pokemonList');
      const loadingTextElement = document.getElementById('loadingText');

      // Function to fetch data for all Pokémon
      async function fetchAllPokemon() {
        try {
          // Fetch the first page to get the total count
          const initialResponse = await fetch('https://pokeapi.co/api/v2/pokemon/');
          const initialData = await initialResponse.json();
          const totalCount = initialData.count;

          // Fetch data for all Pokémon up to ID 1017
          const allPokemonData = [];
          let offset = 0;
          while (allPokemonData.length < 1017) {
            const pageResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/?offset=${offset}`);
            const pageData = await pageResponse.json();
            allPokemonData.push(...pageData.results);
            offset += 20;
          }

          // Display the container while fetching is in progress
          pokemonContainer.style.display = 'block';

          // Fetch detailed information for each Pokémon
          for (let i = 0; i < 1017; i++) {
            const pokemon = allPokemonData[i];
            const pokemonResponse = await fetch(pokemon.url);
            const pokemonData = await pokemonResponse.json();

            // Create list item with Pokémon name and image
            const listItem = document.createElement('li');
            listItem.className = 'col-12 col-sm-6 col-md-4 col-lg-3';
            listItem.innerHTML = `
              <div class="card loaded">
                <img src="${pokemonData.sprites.front_default}" class="card-img-top loaded" alt="${pokemonData.name}">
                <div class="card-body">
                  <h5 class="card-title">${pokemonData.name}</h5>
                  <p class="card-text">ID: ${pokemonData.id}</p>
                </div>
              </div>
            `;

            // Append the list item to the Pokemon list
            pokemonListElement.appendChild(listItem);

            // Update loading text
            loadingTextElement.textContent = `Loading... (${i + 1}/${1017})`;
          }

          // Update container styles after fetching is complete
          pokemonListElement.classList.add('loaded'); // Add 'loaded' class to update styles
          pokemonContainer.classList.add('loaded'); // Add 'loaded' class to update styles
          loadingElement.style.display = 'none'; // Hide loading animation
        } catch (error) {
          console.error('Error fetching Pokémon data:', error);
          loadingElement.innerHTML = 'Error loading Pokémon data';
        }
      }

      // Call the function to fetch Pokémon data
      await fetchAllPokemon();
    });