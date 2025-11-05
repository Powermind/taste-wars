/**
 * Hybrid Normalized Weighted Cosine Similarity
 *
 * - Ignores titles rated 0 (unseen)
 * - Combines mean-centered (pattern) and raw (scale) cosine similarities
 * - Returns similarity ∈ [0,1], confidence ∈ [0,1], and overlap count
 * - Confidence = fraction of total titles both users rated
 */
export function normalizedWeightedCosine(userA, userB, totalTitlesCount = Object.keys(userA).length) {
  const titles = Object.keys(userA);
  const common = titles.filter(
    t =>
      userA[t] > 0 &&
      userB[t] > 0 &&
      typeof userA[t] === "number" &&
      typeof userB[t] === "number"
  );

  const overlap = common.length;
  if (overlap === 0) return { similarity: 0, confidence: 0, overlap: 0 };

  // mean-center using only rated titles (>0)
  const ratedA = titles.filter(t => userA[t] > 0);
  const ratedB = titles.filter(t => userB[t] > 0);
  const avgA = ratedA.reduce((sum, t) => sum + userA[t], 0) / ratedA.length;
  const avgB = ratedB.reduce((sum, t) => sum + userB[t], 0) / ratedB.length;

  // prepare accumulators
  let dot = 0, magA = 0, magB = 0;
  let rawDot = 0, rawMagA = 0, rawMagB = 0;

  for (const t of common) {
    // mean-centered values (pattern)
    const a = userA[t] - avgA;
    const b = userB[t] - avgB;
    dot += a * b;
    magA += a * a;
    magB += b * b;

    // raw values (absolute scale)
    rawDot += userA[t] * userB[t];
    rawMagA += userA[t] * userA[t];
    rawMagB += userB[t] * userB[t];
  }

  // compute cosine similarities
  const meanCenteredCosine = magA && magB ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
  const rawCosine = rawMagA && rawMagB ? rawDot / (Math.sqrt(rawMagA) * Math.sqrt(rawMagB)) : 0;

  // combine both (70% pattern, 30% scale)
  const combined = 0.7 * Math.max(0, meanCenteredCosine) + 0.3 * Math.max(0, rawCosine);

  // confidence based on overlap vs. total titles
  const confidence = overlap / totalTitlesCount;

  // final weighted similarity
  const weighted = combined * confidence;

  // debugging info (optional)
  // console.log({ ratedA: ratedA.length, ratedB: ratedB.length, overlap, totalTitlesCount, combined });

  return { similarity: weighted, confidence, overlap };
}
