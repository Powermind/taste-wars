<template>
  <div class="container">
    <h1 class="text-3xl font-bold text-yellow-400 mb-6 text-center">
      ⭐ Taste Wars
    </h1>
    <h3><p class="disclaimer">
  This is a fan-made project created purely for fun and educational purposes. 
  Star Wars® is a trademark of Lucasfilm Ltd. All rights belong to their respective owners. 
  This app is <strong>not affiliated with, endorsed by, or officially connected to</strong> Lucasfilm, Disney, or any related person, entity, or deity in this galaxy or any other. 
  May the taste be with you!
    </p>
    </h3>
    <!-- Rating Form -->
    <div class="section-box">
      <div class="flex items-center justify-between mb-2 instructions-wrapper">
        <h2 class="text-xl font-semibold">Rate Each Movie/Series</h2>
        <p>If you have not seen a movie or series, just leave it at 0 and it will be excluded from your taste code.</p>
        <p class="description">The app compares your Star Wars ratings with a friend’s by looking only at the movies and series that both of you have rated. It measures how similar your ratings are, giving more weight when you’ve both rated more titles in common. The result is a percentage that shows how closely your tastes match, along with a confidence score that reflects how many titles were compared. Unseen titles (rating 0) are ignored in the calculation.</p>
        <p class="tech-description">
  <strong>How your Taste Match is calculated:</strong><br>
  Taste Wars uses a custom <em>Hybrid Normalized Weighted Cosine Similarity</em> to compare how closely your ratings align with someone else's.
  Ratings of <code>0</code> (unseen) are ignored, and only titles rated by both users are compared.<br><br>
  First, both rating sets are <em>mean-centered</em> to measure how similarly you like or dislike things relative to your own average — not just how high you rate overall.
  Then, a small part of the score comes from direct (raw) rating similarity to account for similar rating scales.<br><br>
  The two parts are combined (70% pattern, 30% scale), and the result is weighted by how many titles you both rated — your <strong>confidence</strong> level.
  The final match percentage reflects both how aligned your tastes are and how much overlap you share.
</p>
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
        class="flex flex-col sm:flex-row items-center justify-between border-b border-gray-700 rating-wrapper"
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
    <div class="section-box text-center flex-row-wrapper">
      <div class="inner-box">
        <p class="label">Your Taste Code:</p>
        <p class="code">{{ myCode }}</p>
        <button @click="copyCode" class="yellow-btn">Copy My Code</button>
      </div>

      <div class="inner-box">
        <p class="label">Share Your Taste:</p>
        <p class="code break-all">{{ shareLink }}</p>
        <button @click="shareMyTaste" class="yellow-btn">Share My Taste (Copy Link)</button>
      </div>
    </div>


    <!-- Compare with friend and load Your Own Code -->
    <div class="section-box text-center compare-load-wrapper">
      <div class="inner-box">
        <h3 class="">Compare with a Friend</h3>
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
      <div class="inner-box">
        <h3 class="text-lg font-semibold mb-2 text-yellow-400">Load Your Own Ratings</h3>
        <input
          v-model="myImportCode"
          placeholder="Paste your code here..."
          class="w-full px-3 py-2 rounded-xl text-black mb-3"
        />
        <button
          @click="loadMyCode"
          class="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold px-4 py-2 rounded-xl"
        >
          Load My Ratings
        </button>
        </div>
    </div>

    <!-- Compatibility Result -->
    <div v-if="matchResult" class="section-box text-center">
      <h3 class="text-2xl font-bold text-green-400">
        Match: {{ (matchResult.similarity * 100).toFixed(1) }}%
      </h3>
      <p class="text-gray-400">
        Confidence: {{ (matchResult.confidence * 100).toFixed(0) }}% ({{ matchResult.overlap }} titles compared)
      </p>

      <!-- ✅ Radar Chart -->
      <div class="chart-container">
        <Radar v-if="chartReady" :data="chartData" :options="chartOptions" />
      </div>
    </div>
    <p class="footer">&copy;Thomas Krantz 2025</p>
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
const myImportCode = ref("");

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

const shareLink = computed(() => {
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?taste_v1=${encodeURIComponent(myCode.value)}`;
});

async function shareMyTaste() {
  const baseUrl = window.location.origin + window.location.pathname;
  const shareUrl = `${baseUrl}?taste_v1=${encodeURIComponent(myCode.value)}`;

  try {
    await navigator.clipboard.writeText(shareUrl);
    alert("Your shareable link has been copied to the clipboard!");
  } catch (err) {
    console.error("Failed to copy link:", err);
    alert("Couldn't copy the link. You can copy it manually:\n" + shareUrl);
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
  matchResult.value = normalizedWeightedCosine(myMutualRatings, friendMutualRatings, STAR_WARS_TITLES.length);

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
  // alert("Random ratings generated!");
}

function loadMyCode() {
  if (!myImportCode.value.trim()) {
    alert("Please paste a valid code.");
    return;
  }

  try {
    const decoded = decodeRatings(myImportCode.value.trim(), STAR_WARS_TITLES);
    ratings.value = { ...decoded };
    alert("Your ratings have been loaded!");
  } catch (err) {
    console.error(err);
    alert("Invalid code. Please check and try again.");
  }
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
/* === GLOBAL BACKGROUND === */
body {
  background: radial-gradient(circle at top, #0a0a0f 0%, #000 80%);
  background-attachment: fixed;
  color: #fdfdfd;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  margin: 0;
}

/* === MAIN CONTAINER === */
.container {
  padding: 2rem;
  max-width: 1000px;
  margin: 2rem auto;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  color: #fff;
  border-radius: 20px;
  box-shadow: 0 10px 20px rgba(255, 215, 0, 0.2);
  border: 1px solid rgba(255, 215, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* === HEADINGS === */
h1 {
  font-family: 'Orbitron', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 2rem;
  font-weight: 800;
  text-align: center;
  color: #ffd700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
  margin: 0 0 1rem 0;
}

h2, h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #facc15;
  margin: 0 0 0.5rem 0;
}

.disclaimer {
  font-weight: 400;
  font-size: 1rem;
  text-align: center;
}

/* === SECTION BOXES === */
.section-box {
  background-color: rgba(30, 30, 30, 0.7);
  padding: 1.5rem;
  border-radius: 20px;
  box-shadow: 0 5px 15px rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.1);
  transition: all 0.2s ease-in-out;
}

.section-box:hover {
  border-color: rgba(255, 215, 0, 0.3);
  box-shadow: 0 10px 20px rgba(255, 215, 0, 0.2);
}

input[type="range"] {
  flex-grow: 1;
  cursor: pointer;
  accent-color: #facc15; /* yellow */
}

/* === TEXT INPUTS === */
input[type="text"],
textarea {
  width: 100%;
  padding: 0.5rem;
  border-radius: 12px;
  border: none;
  outline: none;
  color: #000;
}

/* === BUTTONS === */
button {
  padding: 0.5rem 1rem;
  margin: 5px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

button:hover {
  opacity: 0.9;
}

/* === RADAR CHART CONTAINER === */
.chart-container {
  margin-top: 1rem;
}

/* === ANIMATED STAR BACKGROUND === */
@keyframes stars {
  from { background-position: 0 0; }
  to { background-position: 10000px 10000px; }
}

body::before {
  content: "";
  position: fixed;
  top: 0; left: 0;
  width: 200%;
  height: 200%;
  background: transparent url('https://www.transparenttextures.com/patterns/stardust.png') repeat;
  opacity: 0.2;
  animation: stars 200s linear infinite;
  z-index: -1;
}

.instructions-wrapper {
  text-align: center;
}

/* Flex container for side-by-side wrappers */
.flex-row-wrapper {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 2rem; /* space between the two boxes */
  flex-wrap: wrap; /* wrap on smaller screens */
}

/* Inner wrapper styling */
.inner-box {
  flex: 1 1 45%; /* grow/shrink and default 45% width */
  background-color: rgba(30, 30, 30, 0.7);
  padding: 1rem;
  border-radius: 15px;
  text-align: center;
  box-shadow: 0 5px 10px rgba(255, 215, 0, 0.1);
}

.compare-load-wrapper {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 2rem; /* space between the two boxes */
  flex-wrap: wrap; /* wrap on smaller screens */
}

/* Labels and code styling */
.label {
  font-size: 0.9rem;
  color: #aaa;
  margin-bottom: 0.3rem;
}

.code {
  font-family: monospace;
  font-size: 1.1rem;
  color: #facc15;
  word-break: break-all;
  margin-bottom: 0.5rem;
}

/* Buttons */
.yellow-btn {
  background-color: #facc15;
  color: #111;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.yellow-btn:hover {
  background-color: #ffea00;
}

.tech-description {
  font-size: 10px;
  margin-top: 5px;
}

.description {
  font-size: 10px;
  margin: 5px;
}

.footer {
  width: 100%;
  text-align: center;
  font-size: 10px;
}

.rating-wrapper {
  margin-top: 10px;
  margin-bottom: 10px;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .innerbox {
    flex: 1 1 100%; /* stack vertically on small screens */
  }
  .chart-container {
    padding: 0;
    margin: 0;
  }
  .container {
    padding: 5px;
  }
}


</style>


