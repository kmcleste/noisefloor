#!/usr/bin/env node
// Deterministic implementation of the freshness + dedup-decay terms.
// The agent reasons with the same formulas in prompts/research.md; this file
// lets you unit-test the behavior and tune the half-lives without an LLM in
// the loop.
//
//   node scripts/score.mjs --similarity 0.9 --days 5 --published 3
//
// --similarity : topical overlap [0,1] with the nearest manifest entry
// --days       : days since that entry was last covered
// --published  : how many days ago the candidate itself was published

const HALF_LIFE_DEDUP = 21; // days — how fast a covered topic becomes eligible again
const HALF_LIFE_FRESH = 7;  // days — how fast a new story goes cold
const NOVELTY_THRESHOLD = 0.6;

export function recency(daysSincePublished, halfLife = HALF_LIFE_FRESH) {
  return 2 ** (-daysSincePublished / halfLife);
}

export function novelty(similarity, daysSinceCovered, halfLife = HALF_LIFE_DEDUP) {
  const suppression = similarity * 2 ** (-daysSinceCovered / halfLife);
  return 1 - suppression;
}

export function shouldCover(similarity, daysSinceCovered, materiallyNew = false) {
  return materiallyNew || novelty(similarity, daysSinceCovered) >= NOVELTY_THRESHOLD;
}

// --- tiny CLI -------------------------------------------------------------
function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : Number(process.argv[i + 1]);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const similarity = arg("similarity", 0.9);
  const days = arg("days", 5);
  const published = arg("published", 3);

  const n = novelty(similarity, days);
  const r = recency(published);
  console.log(JSON.stringify({
    inputs: { similarity, daysSinceCovered: days, daysSincePublished: published },
    novelty: +n.toFixed(3),
    recencyWeight: +r.toFixed(3),
    cover: shouldCover(similarity, days),
    note: `cover if novelty >= ${NOVELTY_THRESHOLD} or the story is materially new`,
  }, null, 2));
}
