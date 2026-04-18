# Weekly Routine Prompt

This is the source-of-truth prompt that runs in the Claude Code routine
at claude.ai/code/scheduled. Edits here should be copy-pasted into the
routine config — the routine does not read this file at runtime.

The prompt has been kept in sync with:

- `data/issues.json` shape: `{ id: number, date: "YYYY-MM-DD", title: string, path: string, preview: string }`
- Storage path: `issues/issue-NNN.html`
- Manifest action parsing: `<title>` format and `<meta name="description">`
- No Vercel rewrites — `/issues/...` and `/assets/...` are the literal URLs
- **Architecture v3 — external CSS + parallel subagents**
  - v1 (monolithic inline CSS + markup) timed out (session wall-clock)
  - v2 (parallel subagents + inlined CSS assembly) timed out on the
    final-assembly Write stream (idle timeout)
  - v3 externalizes styling to `/assets/issue.css` and nav JS to
    `/assets/issue.js`, which stay committed in the repo once. Each
    issue's HTML is ~12k chars — well under the streaming-idle threshold.

---

## The Prompt

You are generating this week's issue of the GTM Engineering Field Guide,
a personal editorial magazine for learning and reference.

Architecture: **research → parallel subagents → small final Write**. All
styling lives at `/assets/issue.css` and navigation at `/assets/issue.js`
— the routine does NOT generate CSS or nav JS. Do not inline styling.

### STEP 1 — Compute issue metadata

- Read `data/issues.json` from the repo working directory.
- Next `id` = (max existing `id`) + 1. If the file is `[]`, `id = 1`.
- Zero-padded filename form: `NNN = String(id).padStart(3, '0')`.
- Display date: `"MONTH DD, YYYY"` (e.g., `"APRIL 17, 2026"`). The
  manifest date (`YYYY-MM-DD`) is derived by the GitHub Action.

### STEP 2 — Research

Search the web for 12 high-quality GTM engineering signals from the
past 7 days. Sources: new Substack issues, viral LinkedIn posts from
known practitioners (Eric Nowoslawski, Patrick Spychalski, Everett
Berry, Jordan Crawford, Brendan Short, Matteo Tittarelli, Maja Voje),
new Clay/n8n templates, cohort launches, compensation data, new tools.

Anchor mix:

- **Recurring staples** (The GTM Engineer Pulse, The Signal, GTM
  Foundry, Clay Community, GTME HQ) when fresh content exists.
- **Fresh weekly picks** — specific posts, playbooks, threads, tool
  launches.

**Quality bar**: at least 3 items must be genuinely new (not repeated
from the previous issue). Diff against the most recent file in
`issues/` to check.

Pick a **theme** and a **pull quote** for the back cover.

Write the structured research to `/tmp/items.json` as a JSON array of
exactly 12 objects with this schema:

```json
[
  {
    "rank": "01",
    "category": "SUBSTACK",
    "headline": "Short editorial headline (<= 8 words)",
    "url": "https://...",
    "handle_display": "@handle or domain.com",
    "description": "2–3 line Source Serif body describing the source or post.",
    "signal_metric": "Number, date, or one-line pull quote — must fit on ONE rendered line; max 5 words",
    "medium": "SUBSTACK | YOUTUBE | COHORT | LINKEDIN | HUB | POST",
    "callout_body": "2–3 sentences, max 50 words. Concrete editorial margin notes — what to borrow, build, or ignore. Reference specific tactics, plays, or frameworks. No 'subscribe and learn' fluff."
  }
]
```

Write `/tmp/meta.json` with:

```json
{
  "id": 1,
  "nnn": "001",
  "display_date": "APRIL 17, 2026",
  "theme": "Enrichment Stack",
  "description": "15-word summary of this week's theme for <meta name=description>",
  "subtitle": "Unique sub-masthead (one line, italic)",
  "category_mix": "SHORT COVER TAG (e.g., 'SUBSTACK · COHORT · POST')",
  "pull_quote": "Sharp pull quote for back cover (max ~20 words)",
  "pull_quote_source": "— SOURCE NAME"
}
```

### STEP 3 — Generate content pages via parallel subagents

Launch **12 parallel Task tool calls** (one per item). Each subagent
uses Sonnet and returns ONLY the `<section>` markup.

#### Light/dark rotation

- Ranks `02, 04, 06, 08, 10, 12` → `class="page light"`
- Ranks `01, 03, 05, 07, 09, 11` → `class="page dark"`

#### Subagent invocation

For each item, invoke Task with:

- **subagent_type**: `general-purpose`
- **model**: `sonnet`
- **description**: `Generate page {rank}`
- **prompt** (literal text, with `{item}` and `{VARIANT}` replaced):

```
Generate exactly one HTML <section> element for a single magazine page.
Return ONLY the <section>...</section> markup. No <html>, <head>, <body>,
<style>, <script>, markdown fences, or commentary. No preamble. No trailing prose.

Item data:
{item}

Page variant class: "{VARIANT}"

Required HTML structure (use the exact class names below — CSS lives in /assets/issue.css):

<section class="page {VARIANT}">
  <div class="page-left">
    <div class="rank-ghost">{rank}</div>
    <div class="category-tag">{category}</div>
    <h2 class="headline">{headline}</h2>
    <div class="handle">{handle_display}</div>
    <p class="description">{description}</p>
  </div>
  <div class="page-right">
    <div class="signal">{signal_metric}</div>
    <div class="medium-tag">{medium}</div>
    <aside class="callout">
      <div class="callout-header">WHY IT MATTERS</div>
      <p class="callout-body">{callout_body}</p>
    </aside>
  </div>
</section>

HTML-escape any angle brackets, ampersands, or quotes that appear inside
text content. Do not add extra classes, attributes, or inline styles.
```

Collect the 12 returned strings in rank order. Strip anything before
`<section` and after `</section>` if a subagent returns stray text.

### STEP 4 — Generate cover and back cover sections (main agent)

Produce these two `<section>` blocks yourself — they're one-off and
don't fit the content-page template.

**Cover** (`<section class="page cover">`):

```html
<section class="page cover">
  <div class="cover-top">VOL. 01 · ISSUE {NNN} · {display_date}</div>
  <div class="masthead">
    <span class="line line-gtm">GTM</span>
    <span class="line line-engineering">ENGINEERING</span>
    <span class="line line-fieldguide">FIELD GUIDE</span>
  </div>
  <p class="subtitle">{subtitle}</p>
  <div class="cover-bottom">{category_mix} → SWIPE</div>
</section>
```

(The `.subtitle` belongs inside the middle row — it will naturally
follow `.masthead` in grid flow because `.page.cover` is
`grid-template-rows: auto 1fr auto`. Put `.subtitle` inside a wrapper
div under `.masthead` if needed for centering — or keep as a sibling.)

**Back cover** (`<section class="page back">`):

```html
<section class="page back">
  <div class="back-top">END OF ISSUE · NO. {NNN} / {display_date}</div>
  <div>
    <blockquote class="pull-quote">{pull_quote}</blockquote>
    <div class="attribution">{pull_quote_source}</div>
    <p class="colophon">Set in Playfair Display, Source Serif, and IBM Plex Mono. Compiled from twelve primary sources across newsletters, communities, and practitioner feeds — {display_date}. Intended as a working reference, not a reading list. Every entry is a node in a builder's graph: subscribe, lift the playbook, ship the workflow, measure the lift.</p>
  </div>
  <div class="back-bottom">
    <a href="/">← RETURN TO INDEX</a>
    <span>PRIVATE EDITION</span>
  </div>
</section>
```

### STEP 5 — Assemble and write

Build the file using this exact skeleton (substituting values):

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>GTM Field Guide — Issue {NNN} — {theme}</title>
  <meta name="description" content="{description}" />
  <link rel="stylesheet" href="/assets/fonts.css" />
  <link rel="stylesheet" href="/assets/issue.css" />
</head>
<body>
  <main class="pages">
    {cover section}
    {12 subagent-returned sections in rank order 01–12}
    {back cover section}
  </main>
  <nav class="dots" aria-label="Page navigation"></nav>
  <script src="/assets/issue.js"></script>
</body>
</html>
```

Do NOT inline CSS. Do NOT inline the nav JS. Do NOT add anything not
shown in the skeleton above.

Write the assembled file to `issues/issue-{NNN}.html` with a single
Write call.

### STEP 6 — Commit and push

- Commit message: `Publish issue {NNN} — {display_date} — {theme}`
- Push to main.

**Do not** edit `data/issues.json`. The GitHub Action rebuilds it.

### STEP 7 — Notify

Nothing. The GitHub Action sends Telegram.

---

## Routine Config Checklist

- [ ] Name: `GTME Field Guide Episode Publish`
- [ ] Main model: **Claude Sonnet 4.6** (switched from Opus — Opus stalls on long streams)
- [ ] Prompt: paste the "The Prompt" section above
- [ ] Repository: `gtme-field-guide` — enable *Allow unrestricted branch pushes*
- [ ] Connectors: GitHub (native) only.
- [ ] Allowed tools: `Bash`, `Read`, `Write`, `Edit`, `Glob`, `Grep`, `WebFetch`, `WebSearch`, `Task`
- [ ] Trigger: Fridays 08:00 CDT (`0 13 * * 5` UTC)
