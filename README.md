# AI Intel

A weekly AI intelligence briefing that researches, curates, and publishes
itself. A scheduled GitHub Action runs Claude Code headless; it sweeps the
week's AI news across eight beats, de-duplicates against what it's already
covered, writes one issue as markdown, and pushes to `main`. The push triggers
a Vercel build. No server, no cron box.

```
.github/workflows/research.yml   scheduled runner → research → commit to main
CLAUDE.md                        editorial rubric + beat taxonomy + house rules
prompts/research.md              the run procedure (research → check → write)
scripts/score.mjs                deterministic recency/decay scoring
data/manifest.json               dedup memory (what's been covered, and when)
content/posts/*.md               generated issues
src/                             Astro site (index, issue pages, RSS)
```

## Setup (~15 min)

1. `npm install`
2. Push this repo to GitHub.
3. Add a repo secret **`ANTHROPIC_API_KEY`** (Settings → Secrets → Actions).
4. Import the repo into Vercel and let its Git integration auto-deploy on push
   (framework preset: Astro — zero config).
5. Set `site` in `astro.config.mjs` to your Vercel URL so RSS/canonical links
   resolve.
6. Trigger a run by hand: Actions tab → **Weekly AI Intel** → *Run workflow*.
   Delete the seed issue once a real one lands.

Run the site locally with `npm run dev`.

## How curation works

**Freshness.** Candidates are weighted by how recently they were published, with
a one-week half-life — this week's news outranks anything already cooling off.

**Dedup with decay** (the recency term). A story isn't blocked forever once
covered; suppression decays with a 21-day half-life, so a topic can resurface
months later if there's genuinely new development, without getting repeated
week over week. The rule:

```
suppression = similarity * 2 ** (-daysSinceCovered / 21)
novelty     = 1 - suppression        # cover if novelty >= 0.6, or if materially new
```

Both live in `scripts/score.mjs` so you can tune the half-lives and test them
without an LLM in the loop:

```bash
node scripts/score.mjs --similarity 0.9 --days 5 --published 3
```

**Verification.** Before writing, the agent runs a checker pass: every claim
must trace to a source it fetched this run, at least one primary, or the claim
is dropped. See the maker/checker note below.

## Knobs

- **Cadence** — the cron in `research.yml` (`0 13 * * 1` = Mondays 13:00 UTC).
- **Model** — `--model` in the workflow. Sonnet for routine runs; bump the
  editorial pass to Opus if you split it out (below).
- **Scope** — the beats and signal bar in `CLAUDE.md`.
- **Tool surface** — `--allowedTools` in the workflow. It's intentionally tight;
  widen deliberately.

## Promoting to a real maker/checker split

The baseline runs research + self-check in one Sonnet pass. To harden it, add a
second job that runs *after* the writer: a fresh Opus invocation that gets only
the drafted issue plus the cited URLs and must independently confirm each claim,
failing the run if anything doesn't verify. Separate context, separate model,
adversarial by construction — the checker never sees the maker's reasoning, only
its output. That's the version worth pitching at work.
