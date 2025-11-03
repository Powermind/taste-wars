/**
 * Normalized Weighted Cosine Similarity
 * 
 * Ignores titles rated 0 (unseen).
 * Returns similarity ∈ [0,1], confidence, and overlap.
 */
export function normalizedWeightedCosine(userA, userB) {
  const titles = Object.keys(userA);
  const common = titles.filter(
    t => userA[t] > 0 && userB[t] > 0 && typeof userA[t] === "number" && typeof userB[t] === "number"
  );

  const overlap = common.length;
  if (overlap === 0) return { similarity: 0, confidence: 0, overlap: 0 };

  // mean-center using only rated titles (>0)
  const ratedA = titles.filter(t => userA[t] > 0);
  const ratedB = titles.filter(t => userB[t] > 0);
  const avgA = ratedA.reduce((sum, t) => sum + userA[t], 0) / ratedA.length;
  const avgB = ratedB.reduce((sum, t) => sum + userB[t], 0) / ratedB.length;

  let dot = 0, magA = 0, magB = 0;
  for (const t of common) {
    const a = userA[t] - avgA;
    const b = userB[t] - avgB;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  }

  // cosine similarity, clip negatives to 0
  const cosine = magA && magB ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
  const positiveCosine = Math.max(0, cosine);

  // weight by fraction of overlap relative to smaller rated set
  const totalPossible = Math.min(ratedA.length, ratedB.length);
  const confidence = overlap / totalPossible;
  const weighted = positiveCosine * confidence;

  return { similarity: weighted, confidence, overlap };
}
