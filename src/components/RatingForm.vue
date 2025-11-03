<template>
  <div class="p-6 max-w-3xl mx-auto text-white bg-gray-900 rounded-2xl shadow-lg">
    <h2 class="text-2xl font-bold text-yellow-400 mb-6">
      ⭐ Rate the Star Wars Universe
    </h2>

    <!-- Ratings Sliders -->
    <div
      v-for="(title, index) in STAR_WARS_TITLES"
      :key="index"
      class="flex flex-col sm:flex-row items-center justify-between mb-4 border-b border-gray-700 pb-2"
    >
      <label :for="'rating-' + index" class="w-full sm:w-1/2 font-semibold mb-2 sm:mb-0">
        {{ title }}
      </label>

      <div class="flex items-center gap-3 w-full sm:w-1/2">
        <input
          type="range"
          :id="'rating-' + index"
          min="0"
          max="10"
          step="1"
          v-model.number="ratings[title]"
          class="flex-grow accent-yellow-400"
        />
        <span class="w-6 text-right text-yellow-300">{{ ratings[title] }}</span>
      </div>
    </div>

    <!-- Live Code Display -->
    <div class="mt-6 bg-gray-800 p-4 rounded-xl text-center">
      <p class="text-sm text-gray-400">Your Taste Code:</p>
      <p class="font-mono text-xl text-yellow-400 break-all">{{ encodedCode }}</p>

      <button
        @click="copyCode"
        class="mt-3 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-4 py-2 rounded-xl"
      >
        Copy Code
      </button>
    </div>

    <!-- Actions -->
    <div class="mt-6 flex flex-col sm:flex-row gap-3">
      <button
        @click="resetRatings"
        class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-xl"
      >
        Reset
      </button>

      <button
        @click="emitRatings"
        class="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2 rounded-xl flex-grow"
      >
        Save Ratings
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { STAR_WARS_TITLES } from "@/data/movies.js";
import { encodeRatings } from "@/data/encodeRatings.js";

// Initialize ratings (0 = not seen)
const ratings = ref(Object.fromEntries(STAR_WARS_TITLES.map(t => [t, 0])));

// Computed property: re-encode whenever ratings change
const encodedCode = computed(() => encodeRatings(ratings.value, STAR_WARS_TITLES));

// Emit ratings upward if needed
const emit = defineEmits(["submit"]);
function emitRatings() {
  emit("submit", { ...ratings.value });
}

function resetRatings() {
  for (const title of STAR_WARS_TITLES) ratings.value[title] = 0;
}

async function copyCode() {
  try {
    await navigator.clipboard.writeText(encodedCode.value);
    alert("Code copied to clipboard!");
  } catch (err) {
    console.error("Failed to copy:", err);
  }
}
</script>

<style scoped>
input[type="range"] {
  width: 100%;
  cursor: pointer;
}
</style>
