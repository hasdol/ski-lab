// src/helpers/buildKeywords.ts
'use client';
import i18n from '@/lib/i18n/i18n';

const MIN = 3;                                     // keep in sync with usePaginatedResults

export const buildKeywords = (data, lng = 'en') => {
  const t = (key) => (key ? i18n.t(key, { lng }) : '');

  /** 1. Collect the base tokens --------------------------------------- */
  const raw = [
    t(data.style),
    data.location,
    t(data.snowCondition?.grainType),
    t(data.snowCondition?.source),
    ...(data.rankings ?? []).flatMap(r => [r.brand, r.serialNumber, r.grind]),

    /* --- SKI‑specific --------------------------------- */
    data.serialNumber,              // SNR
    data.brand,
    data.model,
    data.grind,
    data.base,
    data.skiType,                   // cold / universal / warm
  ]
    .filter(Boolean)
    .flatMap(s => s.toString().toLowerCase().trim().split(/[\s‑-]+/)); // split on space/dash

  /** 2. Expand each token into all prefixes ≥ MIN chars --------------- */
  const expanded = raw.flatMap(word => {
    if (word.length < MIN) return [];
    const pfx = [];
    for (let i = MIN; i <= word.length; i++) pfx.push(word.slice(0, i));
    return pfx;
  });

  /** 3. Uniqueness + return ------------------------------------------- */
  return [...new Set(expanded)];
};
