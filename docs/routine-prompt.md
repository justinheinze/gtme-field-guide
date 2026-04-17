# Weekly Routine Prompt

This is the source-of-truth prompt that runs in the Claude Code routine
at claude.ai/code/routines each Friday at 08:00 CT. Edits here should
be copy-pasted into the routine config — the routine does not read this
file at runtime.

The prompt has been kept in sync with:

- `data/issues.json` shape: `{ id: number, date: "YYYY-MM-DD", title: string, path: string, preview: string }`
- Storage path: `issues/issue-NNN.html`
- Manifest action parsing: `<title>` format and `<meta name="description">`
- No Vercel rewrites — `/issues/...` and `/assets/...` are the literal URLs

---

## The Prompt

You are generating this week's issue of the GTM Engineering Field Guide,
a personal editorial magazine for learning and reference.

### STEP 1 — Compute issue metadata

- Read `data/issues.json` from the repo working directory.
- Next `id` = (max existing `id`) + 1. If the file is `[]`, `id = 1`.
- Zero-padded filename form: `NNN = String(id).padStart(3, '0')`.
- Date = today, formatted as `"MONTH DD, YYYY"` for display
  (e.g., `"APRIL 17, 2026"`). The manifest date (`YYYY-MM-DD`) is
  derived separately by the GitHub Action from the file's commit
  date — you do not write to the manifest.

### STEP 2 — Research

Search the web for the most relevant GTM engineering signals from the
past 7 days — new Substack issues, viral LinkedIn posts from known
practitioners (Eric Nowoslawski, Patrick Spychalski, Everett Berry,
Jordan Crawford, Brendan Short, Matteo Tittarelli, Maja Voje), new
Clay/n8n templates, cohort launches, compensation data, new tools.

Anchor the issue in **12 items**:

- **Recurring staples** (The GTM Engineer Pulse, The Signal, GTM
  Foundry, Clay Community, GTME HQ) when they have fresh content
  worth citing.
- **Fresh weekly picks** — specific posts, playbooks, threads, tool
  launches.

**Quality bar**: at least 3 items in each issue must be genuinely new
(not repeated from the previous issue). Diff against the most recent
file in `issues/` to check.

### STEP 3 — Generate the magazine HTML

Create a 14-page horizontal-swipe editorial magazine as a single
self-contained HTML file. E-ink aesthetic: monochrome only, Playfair
Display for headlines, Source Serif for body, IBM Plex Mono for
metadata.

**Required `<head>` elements**:

```html
<title>GTM Field Guide — Issue NNN — [Theme]</title>
<meta name="description" content="[15-word summary of this week's theme]" />
```

The manifest action parses both of these — the title for the rack
listing, the description for the preview field. Do not omit either.

**Page structure**:

- **Page 1** — dark cover
- **Pages 2–13** — one resource/signal per page, alternating light/dark
- **Page 14** — dark back cover

**Page 1 — dark cover**:

- Top-left mono: `VOL. 01 · ISSUE [NNN] · [DATE]`
- Center masthead (Playfair, 8vw+):
  - `GTM`
  - `ENGINEERING`
  - `FIELD GUIDE`
- Sub-masthead (Source Serif italic, 2vw): unique subtitle for this
  week's theme
- Bottom-right mono: `[category mix] → SWIPE`

**Pages 2–13 — the 12 resources (55/45 split)**:

Left (55%):

- Giant ghosted rank number (01–12)
- Category tag in IBM Plex Mono uppercase
- Editorial headline at 5vw+
- URL / handle in mono
- 2–3 line Source Serif description

Right (45%):

- Signal metric at 6.5vw+ (number, date, or pull quote)
- Medium tag (SUBSTACK / YOUTUBE / COHORT / LINKEDIN / HUB / POST)
- Callout box: background tint + 4px left border
- Callout header: `WHY IT MATTERS`
- Callout body: **concrete** note on what the reader should take from
  this resource — what to borrow, what to build, what to ignore.
  Reference specific tactics, plays, or frameworks the source is
  known for. No "subscribe and learn" fluff. Treat it as editorial
  margin notes for a reader who wants to learn GTM engineering by
  doing, not by accumulating subscriptions.

**Page 14 — dark back cover**:

- Top-left mono: `END OF ISSUE · NO. [NNN] / [DATE]`
- Center pull quote (Playfair italic, 4vw, max 70% width): sharp pull
  quote from one of the week's sources
- Attribution (mono): `— [SOURCE]`
- Colophon (Source Serif, 1.4vw):
  > Set in Playfair Display, Source Serif, and IBM Plex Mono.
  > Compiled from twelve primary sources across newsletters,
  > communities, and practitioner feeds — [DATE].
  > Intended as a working reference, not a reading list. Every
  > entry is a node in a builder's graph: subscribe, lift the
  > playbook, ship the workflow, measure the lift.
- Bottom-left mono: `← RETURN TO INDEX` linking to `/`
- Bottom-right mono: `PRIVATE EDITION`

**Hard rules**:

- `100vw × 100vh` pages, CSS transform-based horizontal pagination,
  no scroll
- Arrow key + swipe + wheel + dot navigation
- Headlines 5vw+. Signal metric 6.5vw+. Body `max(17px, 1.5vw)`.
- High contrast on dark pages. Body `.85` opacity minimum. Callout
  text `.8` opacity.
- Nothing overlapping. Generous `margin-bottom`. `10vh` bottom padding.
- Full-bleed edge-to-edge. No floating cards. No padding boxes.
- Self-contained HTML: inline all CSS and JS. Only external resource
  allowed is a single Google Fonts CDN `<link>`.

### STEP 4 — Commit

- Write the HTML to `issues/issue-[NNN].html`.
- Commit message: `Publish issue [NNN] — [date] — [theme]`.
- Push to main. Unrestricted branch push is enabled on this repo.

**Do not** edit `data/issues.json`. The GitHub Action rebuilds it
automatically on push.

### STEP 5 — Notify

Post to Slack via the Slack MCP connector:

> 📖 Field Guide Issue [NNN] shipped — [theme] — https://gtme-field-guide.vercel.app/issues/issue-[NNN].html

If the Slack connector is not attached to this routine, skip this step
silently rather than failing the run.

---

## Routine Config Checklist (claude.ai/code/routines)

- [ ] Name: `GTM Field Guide — Weekly Publisher`
- [ ] Model: Claude Opus 4.7
- [ ] Prompt: paste the "The Prompt" section above
- [ ] Repository: `gtme-field-guide` — enable *Allow unrestricted branch pushes*
- [ ] Environment: default (web search on)
- [ ] Connectors: GitHub (native) + Slack MCP. Remove everything else.
- [ ] Trigger: Schedule → Weekly → Friday 08:00 local
- [ ] Test: click *Run now*, review the session at claude.ai/code, verify:
  - [ ] `issues/issue-NNN.html` pushed
  - [ ] GitHub Action ran and rebuilt `data/issues.json`
  - [ ] Vercel redeployed
  - [ ] Slack message posted
  - [ ] Index page shows new band for the issue
