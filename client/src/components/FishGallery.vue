<script setup>
import { computed, ref, watch } from 'vue'
import LoginApi from '../LoginApi'
import ItemVisual from './ItemVisual.vue'

const props = defineProps({
  item: { type: Object, required: true },
})

const slide = ref(0)
const loading = ref(false)
const requestFailed = ref(false)
const imageLoaded = ref(false)
const imageFailed = ref(false)

const photo = computed(() =>
  props.item.photos?.[0] ?? props.item.speciesInfo?.photo
)

watch(
  () => photo.value?.url,
  () => {
    imageLoaded.value = false
    imageFailed.value = false
  },
)

async function showPhoto() {
  slide.value = 1

  // Reuse species information if the shop has already retrieved it.
  if (photo.value || props.item.speciesInfo || loading.value) return

  loading.value = true
  requestFailed.value = false

  try {
    const { data } = await LoginApi.get('/api/species', {
      params: { name: props.item.sci },
      timeout: 35000,
    })

    props.item.speciesInfo = data
  } catch (error) {
    requestFailed.value = true
    console.error('Unable to load fish photo:', error)
  } finally {
    loading.value = false
  }
}

function retry() {
  if (requestFailed.value) {
    showPhoto()
  } else {
    // Recreate the image element to retry downloading the photo.
    imageLoaded.value = false
    imageFailed.value = false
  }
}
</script>

<template>
  <div class="fish-gallery">
    <div class="fish-gallery__stage">
      <ItemVisual v-if="slide === 0" :item="item" />

      <template v-else>
        <p v-if="loading" class="gallery-message" role="status">
          <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
          Loading fish photo…
        </p>

        <div
          v-else-if="requestFailed || imageFailed"
          class="gallery-message"
          role="status"
        >
          <p>Unable to display this fish photo.</p>
          <button type="button" class="btn btn-ghost btn-sm" @click="retry">
            Try again
          </button>
        </div>

        <template v-else-if="photo?.url">
          <img
            :src="photo.url"
            :alt="`Real photograph of ${item.name}`"
            :class="{ 'photo-hidden': !imageLoaded }"
            @load="imageLoaded = true"
            @error="imageFailed = true"
          />

          <p v-if="!imageLoaded" class="gallery-message" role="status">
            <span class="spinner-border spinner-border-sm" aria-hidden="true"></span>
            Loading fish photo…
          </p>
        </template>

        <p v-else class="gallery-message" role="status">
          No licensed photo available for this fish.
        </p>
      </template>
    </div>

    <div class="gallery-controls" aria-label="Choose fish image">
      <button
        type="button"
        :aria-pressed="slide === 0"
        @click="slide = 0"
      >
        Illustration
      </button>

      <button
        type="button"
        :aria-pressed="slide === 1"
        @click="showPhoto"
      >
        Real photo
      </button>
    </div>

    <p
      v-if="slide === 1 && photo?.url && imageLoaded && !imageFailed"
      class="photo-credit"
    >
      {{ photo.attribution }}
      <a
        :href="photo.sourceUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ photo.source }} · {{ photo.license }}
      </a>
    </p>
  </div>
</template>

<style scoped>
.fish-gallery {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.fish-gallery__stage {
  position: relative;
  flex: 1;
  min-height: 100px;
  overflow: hidden;
}

.fish-gallery__stage > .item-visual {
  position: absolute;
  inset: 0;
}

.fish-gallery__stage img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.photo-hidden {
  visibility: hidden;
}

.gallery-message {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin: 0;
  padding: 0.5rem;
  text-align: center;
  font-size: 0.8rem;
}

.gallery-message p {
  margin: 0;
}

.gallery-controls {
  display: flex;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.35rem;
}

.gallery-controls button {
  min-height: 36px;
  padding: 0.3rem 0.5rem;
  border: 1px solid currentColor;
  border-radius: 0.5rem;
  background: transparent;
  color: inherit;
  font-size: 0.75rem;
}

.gallery-controls button[aria-pressed='true'] {
  background: var(--al-aqua);
  color: #082c32;
}

.photo-credit {
  margin: 0;
  padding: 0.25rem;
  max-height: 3rem;
  overflow-y: auto;
  overflow-wrap: anywhere;
  text-align: center;
  font-size: 0.65rem;
}

.photo-credit a {
  display: block;
  color: inherit;
}
</style>