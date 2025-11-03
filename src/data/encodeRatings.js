// encodeRatings.js
// Compactly encode & decode user Star Wars ratings into a Base62 string.

const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/**
 * Encodes user ratings (0–10) into a Base62 string.
 * Each rating is a single digit (0–A), stored as base-11 and packed.
 *
 * @param {Object} ratings - e.g. { "A New Hope": 10, "Andor": 9 }
 * @param {string[]} titles - from movies.js
 * @returns {string} encoded string
 */
export function encodeRatings(ratings, titles) {
  // Build an array of 0–10 integers following consistent order
  const numericRatings = titles.map(title => {
    const r = ratings[title];
    return typeof r === "number" && r >= 0 && r <= 10 ? r : 0;
  });

  // Convert base-11 digits (0–10) into a large integer
  let value = 0n;
  for (const r of numericRatings) {
    value = value * 11n + BigInt(r);
  }

  // Convert that BigInt to Base62 string
  if (value === 0n) return BASE62[0];
  let encoded = "";
  while (value > 0n) {
    encoded = BASE62[value % 62n] + encoded;
    value = value / 62n;
  }

  return encoded;
}

/**
 * Decodes a Base62 string back into user ratings.
 *
 * @param {string} code - encoded string
 * @param {string[]} titles - from movies.js
 * @returns {Object} decoded ratings { title: number }
 */
export function decodeRatings(code, titles) {
  // Convert Base62 back to a BigInt
  let value = 0n;
  for (const c of code) {
    const idx = BASE62.indexOf(c);
    if (idx === -1) throw new Error("Invalid Base62 character");
    value = value * 62n + BigInt(idx);
  }

  // Extract base-11 digits (reverse order)
  const decoded = {};
  for (let i = titles.length - 1; i >= 0; i--) {
    const rating = Number(value % 11n);
    decoded[titles[i]] = rating;
    value = value / 11n;
  }

  return decoded;
}
