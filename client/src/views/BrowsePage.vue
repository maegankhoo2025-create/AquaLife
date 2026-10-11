<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const species = ref([])
const loading = ref(true)
const errorMessage = ref('')

async function loadSpecies() {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await axios.get(
      'http://localhost:8000/api/species/quiz-data'
    )
    species.value = response.data.species
  } catch (error) {
    console.error('Unable to load species:', error)
    errorMessage.value = 'Unable to load fish. Please try again.'
  } finally {
    loading.value = false
  }
}

onMounted(loadSpecies)
</script>





<template>
  <main class="browse-page">
    <h1>Explore fish species</h1>
    <p>Discover fish for your virtual aquarium.</p>

    <p v-if="loading">Loading fish...</p>

    <div v-else-if="errorMessage">
      <p>{{ errorMessage }}</p>
      <button @click="loadSpecies">Try again</button>
    </div>

    <div v-else  class="species-grid">
  <article v-for="fish in species" :key="fish.gbifKey" class="species-card">
    <h2>{{ fish.commonName || fish.canonicalName }}</h2>
    <p><em>{{ fish.canonicalName }}</em></p>

    <template v-if="fish.photo">
      <img
        :src="fish.photo.url"
        :alt="fish.commonName || fish.canonicalName"
        width="240"
      >
      <p>
        <a
          :href="fish.photo.sourceUrl"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ fish.photo.attribution }}
        </a>
      </p>
    </template>
    <div v-else class="photo-placeholder">
         Photo unavailable
    </div>

    <details>
      <summary>View species details</summary>
      <p>Family: {{ fish.family || 'Unavailable' }}</p>
      <p>Genus: {{ fish.genus || 'Unavailable' }}</p>
      <p>Species information source: {{ fish.source }}</p>
    </details>
  </article>
</div>
  </main>
</template>

<style scoped>
.browse-page {
  min-height: 100vh;
  padding: 32px;
  background: #081524;
  color: #eef6ff;
}

.browse-page > p {
  color: #b5c8db;
}

.species-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
  margin-top: 24px;
}

.species-card {
  min-width: 0;
  padding: 20px;
  border: 1px solid #29435b;
  border-radius: 18px;
  background: #11263c;
}

.species-card h2 {
  margin-top: 0;
  font-size: 1.3rem;
}

.species-card img {
  display: block;
  width: 100%;
  height: 190px;
  object-fit: contain;
  background: #0a1b2c;
  border-radius: 12px;
}

.species-card a {
  color: #75e5e8;
  font-size: 0.8rem;
  overflow-wrap: anywhere;
}

.species-card summary {
  padding: 12px 0;
  color: #75e5e8;
  cursor: pointer;
}

.species-card details {
  margin-top: 16px;
  border-top: 1px solid #29435b;
}

@media (max-width: 600px) {
  .browse-page {
    padding: 20px 16px;
  }

  .species-grid {
    grid-template-columns: 1fr;
  }
}

.photo-placeholder {
  height: 190px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: #0a1b2c;
  color: #b5c8db;
}
</style>