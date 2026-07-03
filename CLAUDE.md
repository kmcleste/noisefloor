# AI Intel — house standards

This repo publishes a weekly AI intelligence briefing for an engineering
leader. You (Claude Code) are the analyst. Read this file and
`prompts/research.md` on every run.

## Beats (this is the taxonomy — tag every item with exactly one)

| tag          | covers                                                            |
|--------------|------------------------------------------------------------------|
| `models`     | new / updated frontier & open models, benchmarks, capability jumps |
| `frameworks` | agent frameworks, orchestration, SDKs, tooling                    |
| `agents`     | shifts in how people design agentic systems (patterns, evals)     |
| `providers`  | provider business/news: pricing, access, policy, partnerships     |
| `oss`        | open vs closed developments, notable OSS releases                 |
| `enterprise` | building AI for the enterprise: governance, platform, adoption     |
| `rag`        | retrieval, memory, context engineering                            |
| `vision`     | multimodal / vision / document understanding                      |

## Signal vs noise

Publish an item only if it clears the signal bar:

- **Signal:** a net-new capability, a real release with a version/date, a
  concrete pricing or access change, a defensible shift in an agentic pattern,
  a benchmark with methodology, an enterprise-relevant governance/platform move.
- **Noise (skip):** rehashes and roundups of already-known news, funding
  announcements with no product substance, hype threads, vendor blogspam,
  speculation with no primary source, "X might soon…" rumors.

When in doubt, leave it out. A tight six-item issue beats a padded twelve.

## Attribution & copyright (this is a public, automated publisher — non-negotiable)

- Write every item in your own words. **Paraphrase; do not reproduce article
  text.** Any unavoidable direct quote stays under 15 words, and one quote per
  source maximum.
- Never reproduce lyrics, poems, or long passages.
- Every factual claim must trace to a source you actually fetched this run.
  Link the primary source (a vendor blog, paper, or release note beats an
  aggregator). No source → the claim doesn't ship.

## File conventions

- One issue per run: `content/posts/YYYY-MM-DD-HHMM-issue.md` (UTC
  minute-stamp, so running the job twice in a day doesn't overwrite — each run
  is its own post). The `date:` frontmatter is the full UTC timestamp to match.
- Frontmatter must validate against `src/content.config.ts` (title, date,
  summary, beats[], sources[]).
- Update `data/manifest.json` after writing the issue — this is the dedup memory.

## Commit

Small, single-purpose. The workflow handles the actual commit/push; you just
write files into the working tree.
