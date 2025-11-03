<template>
  <div class="p-6 max-w-5xl mx-auto text-white bg-gray-900 rounded-2xl shadow-lg">
    <h1 class="text-3xl font-bold text-yellow-400 mb-6 text-center">
      ⭐ Taste Wars
    </h1>
    <h3>This is a fan-made project. Star Wars® is a trademark of Lucasfilm Ltd. This app is not affiliated with or endorsed by Lucasfilm or Disney.</h3>

    <!-- Rating Form -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-xl font-semibold">Rate Each Movie/Series</h2>
        <button
          @click="randomizeRatings"
          class="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-3 py-1 rounded-xl text-sm"
        >
          🎲 Random
        </button>
        <button
          @click="resetRatings"
          class="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-3 py-1 rounded-xl text-sm ml-2"
        >
          ♻️ Reset
        </button>
      </div>
      <div
        v-for="(title, index) in STAR_WARS_TITLES"
        :key="index"
        class="flex flex-col sm:flex-row items-center justify-between mb-3 border-b border-gray-700 pb-1"
      >
        <label :for="'rating-' + index" class="w-full sm:w-1/2 font-semibold mb-1 sm:mb-0">
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
    </div>

    <!-- Your Code -->
    <div class="mt-8 bg-gray-800 p-4 rounded-xl text-center">
      <p class="text-sm text-gray-400">Your Taste Code:</p>
      <p class="font-mono text-xl text-yellow-400 break-all">{{ myCode }}</p>

      <button
        @click="copyCode"
        class="mt-3 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-4 py-2 rounded-xl"
      >
        Copy My Code
      </button>
    </div>

    <!-- Compare Code Input -->
    <div class="mt-8 bg-gray-800 p-4 rounded-xl text-center">
      <h3 class="text-lg font-semibold mb-2 text-yellow-400">Compare with a Friend</h3>
      <input
        v-model="friendCode"
        placeholder="Paste your friend's code..."
        class="w-full px-3 py-2 rounded-xl text-black mb-3"
      />
      <button
        @click="compareCodes"
        class="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-4 py-2 rounded-xl"
      >
        Compare
      </button>
    </div>

    <!-- Compatibility Result -->
    <div v-if="matchResult" class="mt-8 text-center">
      <h3 class="text-2xl font-bold text-green-400">
        Match: {{ (matchResult.similarity * 100).toFixed(1) }}%
      </h3>
      <p class="text-gray-400">
        Confidence: {{ (matchResult.confidence * 100).toFixed(0) }}% ({{ matchResult.overlap }} titles compared)
      </p>

      <!-- ✅ Radar Chart -->
      <div class="mt-6 bg-gray-800 p-4 rounded-xl">
        <Radar v-if="chartReady" :data="chartData" :options="chartOptions" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { STAR_WARS_TITLES } from "@/data/movies.js";
import { encodeRatings, decodeRatings } from "@/data/encodeRatings.js";
import { normalizedWeightedCosine } from "@/utils/similarity.js";

// Vue Chart.js imports
import { Radar } from "vue-chartjs";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

// Register chart.js components
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

// reactive state
const ratings = ref(Object.fromEntries(STAR_WARS_TITLES.map(t => [t, 0])));
const friendCode = ref("");
const matchResult = ref(null);
const chartReady = ref(false);

// live encoded code
const myCode = computed(() => encodeRatings(ratings.value, STAR_WARS_TITLES));

// chart data
const chartData = ref({
  labels: STAR_WARS_TITLES,
  datasets: [],
});

const chartOptions = {
  scales: {
    r: {
      beginAtZero: true,
      max: 10,
      ticks: { color: "#ccc" },
      grid: { color: "#333" },
      angleLines: { color: "#333" },
      pointLabels: { color: "#fff" },
    },
  },
  plugins: {
    legend: {
      labels: { color: "#fff" },
    },
  },
};

// copy code to clipboard
async function copyCode() {
  try {
    await navigator.clipboard.writeText(myCode.value);
    alert("Code copied to clipboard!");
  } catch (err) {
    console.error("Failed to copy:", err);
  }
}

function compareCodes() {
  if (!friendCode.value.trim()) return alert("Please paste a friend's code.");

  const friendRatings = decodeRatings(friendCode.value.trim(), STAR_WARS_TITLES);
  const myRatings = ratings.value;

  // ✅ Filter only titles both have rated (>0)
  const mutualTitles = STAR_WARS_TITLES.filter(
    (m) => myRatings[m] > 0 && friendRatings[m] > 0
  );

  if (mutualTitles.length === 0) {
    chartReady.value = false;
    matchResult.value = null;
    alert("No common rated titles — can’t make a comparison chart yet!");
    return;
  }

  // Build reduced objects for cosine similarity
  const myMutualRatings = Object.fromEntries(
    mutualTitles.map((m) => [m, myRatings[m]])
  );
  const friendMutualRatings = Object.fromEntries(
    mutualTitles.map((m) => [m, friendRatings[m]])
  );

  // ✅ Now compute similarity on mutual subset only
  matchResult.value = normalizedWeightedCosine(myMutualRatings, friendMutualRatings);

  // Chart uses same subset
  chartData.value = {
    labels: mutualTitles,
    datasets: [
      {
        label: "You",
        backgroundColor: "rgba(250, 204, 21, 0.3)",
        borderColor: "#facc15",
        pointBackgroundColor: "#facc15",
        data: mutualTitles.map((m) => myRatings[m]),
      },
      {
        label: "Friend",
        backgroundColor: "rgba(100, 100, 255, 0.2)",
        borderColor: "#60a5fa",
        pointBackgroundColor: "#60a5fa",
        data: mutualTitles.map((m) => friendRatings[m]),
      },
    ],
  };

  chartReady.value = true;
}

// Generate random ratings for all titles
function randomizeRatings() {
  const newRatings = {};
  for (const title of STAR_WARS_TITLES) {
    // 20% chance of "unseen" (0), otherwise 1–10
    const unseen = Math.random() < 0.2;
    newRatings[title] = unseen ? 0 : Math.floor(Math.random() * 10) + 1;
  }
  ratings.value = newRatings;

  // ✅ myCode updates automatically since it's computed
  alert("Random ratings generated!");
}

function resetRatings() {
  ratings.value = Object.fromEntries(STAR_WARS_TITLES.map(t => [t, 0]));
}

// ✅ Auto-load taste_v1 parameter from URL
onMounted(() => {
  const params = new URLSearchParams(window.location.search);
  const codeFromUrl = params.get("taste_v1");
  if (codeFromUrl) {
    friendCode.value = codeFromUrl;
  }
});
</script>

<style scoped>
input[type="range"] {
  width: 100%;
  cursor: pointer;
}
</style>
