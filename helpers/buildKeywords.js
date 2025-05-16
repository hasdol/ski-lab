'use client';

const MIN = 3; // keep in sync with usePaginatedResults

/**
 * Build search keywords (prefixes) from ski data.
 * @param {object} data - Ski or test data object
 * @returns {string[]} Array of unique search prefixes
 */
export const buildKeywords = (data) => {
  // 1. Collect base tokens
  const rawTokens = [
    data.style,
    data.location,
    data.snowCondition?.grainType,
    data.snowCondition?.source,
    ...(data.rankings ?? []).flatMap(r => [r.brand, r.serialNumber, r.grind]),

    // Ski-specific fields
    data.serialNumber,
    data.brand,
    data.model,
    data.grind,
    data.base,
    data.skiType,
  ]
    .filter(Boolean)
    .flatMap(s => s.toString().toLowerCase().trim().split(/[\s\-]+/));

  // 2. Expand each token into prefixes of length ≥ MIN
  const prefixes = rawTokens.flatMap(word => {
    if (word.length < MIN) return [];
    return Array.from({ length: word.length - MIN + 1 }, (_, i) => word.slice(0, MIN + i));
  });

  // 3. Deduplicate and return
  return [...new Set(prefixes)];
};
