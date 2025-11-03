<template>
  <Radar v-if="chartData" :data="chartData" :options="chartOptions" />
</template>

<script setup>
import { Radar } from "vue-chartjs";
import { Chart as ChartJS, Title, Tooltip, Legend, RadialLinearScale, PointElement, LineElement, Filler } from "chart.js";
ChartJS.register(Title, Tooltip, Legend, RadialLinearScale, PointElement, LineElement, Filler);

// Example chart data (populate dynamically later)
const chartData = {
  labels: ["A New Hope", "Empire", "Jedi"],
  datasets: [
    { label: "You", data: [10, 9, 8], backgroundColor: "rgba(255,215,0,0.3)" },
    { label: "Other Fan", data: [9, 8, 8], backgroundColor: "rgba(0,150,255,0.3)" }
  ]
};

const chartOptions = {
  scales: { r: { min: 0, max: 10 } },
  plugins: { legend: { labels: { color: "#fff" } } }
};
</script>
