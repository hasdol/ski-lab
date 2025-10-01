'use client';

// MIN consistent with search UI
const MIN = 3;

export function buildTeamKeywords(name = '') {
  const tokens = name
    .toString()
    .toLowerCase()
    .trim()
    .split(/[\s\-]+/)
    .filter(Boolean);

  const out = new Set();
  tokens.forEach(word => {
    if (word.length < MIN) return;
    for (let i = MIN; i <= word.length; i++) {
      out.add(word.slice(0, i));
    }
  });
  return Array.from(out);
}