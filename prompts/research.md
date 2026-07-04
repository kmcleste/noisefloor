# Weekly run procedure

You are producing one issue of the NoiseFloor briefing. Work through these phases
in order. Read `CLAUDE.md` first for the beat taxonomy, signal bar, and
attribution rules — they bind everything below.

## 1. Load memory

Read `data/manifest.json`. Every entry is a story already covered, with the
date it was last covered. You'll use this in phase 4 so you don't re-run stale
news.

## 2. Research the beats

Use WebSearch / WebFetch to sweep the last ~7–10 days across all eight beats.
Favor primary sources (vendor blogs, papers, release notes, official docs) —
they're both higher-signal and far more likely to fetch cleanly than
aggregators. For each promising story, note: a short title, the beat, the
source URL(s) you fetched, the publish date, and a one-line "what's new."

If WebFetch fails on a page you need (typically 401/403 — a publisher blocking
scripted requests), retry that one URL with the browser fallback:

    node scripts/fetch.mjs https://example.com/the-article

It renders the page in a real browser and prints the readable text. Use it only
for pages that are genuinely public — it does not and will not get past
paywalls, logins, or anti-bot challenges (it exits non-zero and says so). If the
fallback is also blocked, rely on the WebSearch snippet or drop the claim.
Never fabricate a detail you couldn't actually read from a source this run.

Aim to surface ~12–20 raw candidates before filtering.

## 3. Score for freshness

Rank candidates by recency so this week's genuine news outranks anything that's
already gone cold. Freshness weight for a candidate published `d` days ago:

    recency = 2 ** (-d / 7)        # half-life of one week

## 4. De-duplicate with decay (the recency term you asked for)

For each candidate, find its nearest match in the manifest and estimate a
topical `similarity` in [0, 1] (same story / same release = ~1.0; adjacent but
materially new = ~0.4; unrelated = 0). Let `t` = days since that manifest
entry was last covered. Compute:

    suppression = similarity * 2 ** (-t / 21)   # 21-day half-life
    novelty     = 1 - suppression

Keep the candidate if `novelty >= 0.6`, **or** if there is a materially new
development (a new version, a reversal, a concrete outcome) regardless of score.
This is what lets a topic resurface months later without spamming it weekly.

You can sanity-check the math with the helper:

    node scripts/score.mjs --similarity 0.9 --days 5 --published 3

Select the strongest ~6–10 survivors. Prefer beat spread over piling into one.

## 5. Checker pass (do this before writing anything)

For each selected item, independently verify:

- every factual claim maps to a source URL you fetched this run;
- at least one source is primary, not an aggregator;
- versions, dates, numbers, and names are correct as stated in the source.

Drop any claim you can't stand behind. Drop the whole item if its core claim
won't verify. Treat this as adversarial: assume the draft is wrong until the
sources say otherwise. (Later you can promote this into a separate Opus pass —
see README — but a disciplined self-check is the baseline.)

## 6. Write the issue

Create the issue file at the exact path your run prompt gives you —
`content/posts/YYYY-MM-DD-HHMM-issue.md`, a UTC minute-stamp so more than one
run in a day produces distinct posts instead of overwriting a single file.
Frontmatter:

    ---
    title: "<a specific headline for THIS issue — see below>"
    date: <the exact UTC timestamp from your run prompt, e.g. 2026-07-03T19:28:00Z>
    summary: "<one sentence: the through-line of the week>"
    beats: [models, agents, providers]   # only beats actually covered
    sources: ["https://…", "https://…"]  # every primary source used
    ---

The **title is a headline, not a label** — write it fresh for this issue from
the week's dominant thread (the same thread the summary elaborates). Aim for
~40–70 characters, concrete and editorial. Don't prefix it with the brand
("NoiseFloor" already lives in the site header), don't use "Week of …", and
don't make it a topic list.

- Good: `Washington froze a frontier model for 19 days, then reversed`
- Good: `Three vendors race to fence in what agents can touch`
- Bad:  `AI Intel — Week of Jun 30, 2026` · `Weekly AI news roundup`

If your run prompt didn't supply a stamp (e.g. a local test), use the current
UTC time yourself: filename `content/posts/<YYYY-MM-DD-HHMM>-issue.md`, and a
full `date:` timestamp like `2026-07-03T19:28:00Z`.

Body: a two-sentence editor's note, then one `##` section per item. Head each
section with the beat label span so it styles correctly, e.g.:

    ## <span class="beat">models</span> Your headline here

Then 2–4 sentences of analysis in your own words and an inline link to the
primary source. Analyst voice — what changed and why it
matters to someone building AI for the enterprise. No filler, no hedging.

## 7. Update memory

For each item you published, add or update its entry in `data/manifest.json`:

    {
      "id": "kebab-slug-of-the-story",
      "title": "…",
      "beat": "models",
      "urls": ["https://…"],
      "first_covered": "YYYY-MM-DD",
      "last_covered": "YYYY-MM-DD",
      "times_covered": 1
    }

If it's a re-cover, bump `last_covered` and `times_covered`, keep
`first_covered`. Write valid JSON. Bump the top-level `updated` timestamp.

Stop after writing the files. The workflow commits and pushes.
