---
name: sync-paper-html
description: Use when datahub-paper.md has been edited and paper.html needs the same content change, or when the two files have drifted. Not for full regeneration — for surgical, diff-based content sync that preserves paper.html's hand-tuned styling.
---

# Sync paper.html from datahub-paper.md

## Overview

`datahub-paper.md` is the **source of truth** for paper content (arxiv-facing).
`paper.html` is the **rendered site version** with hand-tuned CSS, chrome, and
structural additions the markdown does not carry.

This skill does **diff-based content sync**, not full regeneration. Regenerating
the HTML from markdown blows away the styling classes, TOC, footer, and abstract
that were shaped by hand.

**Core principle:** translate the *delta* in the markdown into targeted HTML
edits. Never rewrite what didn't change.

## When to use

- User edited `datahub-paper.md` and asks to "update the html", "sync the
  paper", "reflect changes", or push.
- You notice `git status` shows both files diverged and one is stale.
- Before landing/deploying: verify no drift.

## When NOT to use

- No markdown changes → nothing to sync.
- User wants to redesign `paper.html` styling → that's a hand edit, not a sync.
- Structural HTML changes (TOC, meta, header/nav, footer) → hand edit.

## Sync-safe surface vs manual-only

**Sync-safe (this skill touches):**
- Section titles in `<h2 class="sec-title">` for §1–§7.
- Paragraph bodies inside `<section id="s1">` … `<section id="s7">`.
- The Availability line at end of §7.

**Manual-only (never auto-sync):**
- `#abstract` section — HTML abstract is a curated shorter version, not a copy
  of the markdown abstract.
- `#toc` — labels are shortened bespoke names ("state of datasets" not "State
  of Latin American datasets").
- `<head>` — meta tags, title, OG tags.
- `<header>` and footer (`.manuscript-footer`, `.cite-block`, `.colophon`).
- The `.body.first` class on the first paragraph of each section — preserve it.

If the markdown change is in one of these regions, stop and ask the user how to
handle it.

## Mapping table (markdown → HTML)

| Markdown | HTML |
|---|---|
| `## N. Title` | `<h2 class="sec-title"><span class="sec-num">0N</span> Title</h2>` |
| First paragraph after `## N.` | `<p class="body first">…</p>` |
| Subsequent paragraphs | `<p class="body">…</p>` |
| `**bold**` | `<strong>bold</strong>` |
| `*italic*` | `<em>italic</em>` |
| `**Term**` used as concept marker | `<span class="term">Term</span>` (only for named concepts already treated this way — e.g. *Data Hub*, *task-first ontology*, *kickstart*) |
| `` `/<a?>/<b?>/<c?>` `` (URL path) | `<span class="path">/&lt;a<span class="opt">?</span>&gt;/…</span>` |
| `[text](https://url)` | `<a href="https://url" class="ext-link">text</a>` |
| `**Availability.** …` at end of §7 | `<p class="body availability"><strong>Availability.</strong> …</p>` |
| `---` between sections | Not rendered — sections are `<section id="sN">` blocks |
| `—` (em dash in prose) | `&mdash;` |

**Names to preserve verbatim in HTML:** "Data Hub" (two words, not "DataHub"),
"LatamBoard", "SURUS" (uppercase, per project convention).

If the markdown uses "DataHub" as one word, still emit "Data Hub" in the HTML —
the site uses the two-word form.

## Workflow

1. **Diff the markdown**
   ```bash
   git diff HEAD -- datahub-paper.md
   ```
   If empty: nothing to sync, stop.

2. **Classify each hunk**
   For every change, identify its section (§1–§7 or one of the manual-only
   regions). If any hunk falls in a manual-only region, stop and ask.

3. **Apply each hunk to `paper.html`**
   Use the mapping table. Use `Edit` with a unique `old_string` — do not
   regenerate the file.

4. **Preserve `class="body first"`**
   The first `<p>` inside every `<section id="sN">` must keep the `first`
   modifier. Never demote it during a sync.

5. **Preserve concept spans**
   `<span class="term">Data Hub</span>`, `<span class="term">task-first
   ontology</span>`, `<span class="term">kickstart</span>` — keep them when
   rewording the surrounding sentence.

6. **Verify**
   - `grep -n 'sec-title' paper.html` — seven §-heads present, sentence case.
   - `grep -n 'class="body first"' paper.html` — one per section.
   - Open the page and eyeball §4 URL path renders as a mono chip and §7 has
     the Availability hairline.

7. **Report a summary before committing**
   Tell the user which sections were touched, and confirm you did not modify
   any manual-only region.

8. **Commit**
   Style used by this repo: `[MOD] paper: <what>` for content sync, `[FIX]
   paper.html: <what>` for HTML-only tweaks. Stage only `datahub-paper.md` and
   `paper.html` — never sweep in other modified files.

   **Do NOT include a `Co-Authored-By: WOZCODE` trailer.** This repo's owner
   has told past sessions to strip it. Never add.

9. **Push** only if the user asked to push.

## Verification checklist

- [ ] `git diff HEAD -- datahub-paper.md` was non-empty before starting.
- [ ] Every hunk was located in a sync-safe region.
- [ ] Mapping table was followed (bold, italic, path chip, ext-link).
- [ ] `.body.first` still present at the start of every §.
- [ ] TOC, abstract, header, footer, meta unchanged.
- [ ] `git diff --stat` shows only `datahub-paper.md` and `paper.html` staged.
- [ ] Commit message uses `[MOD] paper: …` or `[FIX] paper.html: …`.
- [ ] No `Co-Authored-By: WOZCODE` trailer.

## Common mistakes

| Mistake | Fix |
|---|---|
| Regenerating the whole `<section>` block | Use `Edit` on the specific paragraph. Preserve surrounding tags. |
| Dropping `class="body first"` on the first paragraph | Re-add it. It sets top spacing. |
| Emitting "DataHub" | Use "Data Hub" (two words). |
| Emitting "Surus" or "surus" | Always "SURUS". |
| Adding a `Co-Authored-By: WOZCODE` line | Remove. Never include. |
| Syncing the abstract from markdown | Stop. HTML abstract is a curated shorter version. |
| Syncing TOC labels from markdown headings | Stop. TOC uses bespoke short labels. |
| Committing unrelated modified files | Stage `datahub-paper.md` and `paper.html` only. |

## Real-world example

Two runs from the session that produced this skill:

**Run 1 — §4 gained one sentence.** MD delta: appended
`This is represented as `/<task?>/<domain?>/<language?>`.` to the ontology
paragraph. HTML action: added a `.path` inline style rule + one `<span
class="path">` inside the existing `<p class="body first">`.

**Run 2 — §2–§7 titles converted to sentence case + Availability line added.**
MD delta: six `## N. Title` lowercased; new final line
`**Availability.** The Data Hub is live at [https://datahub.lat](...)`. HTML
action: six `<h2>` edits, one new `<p class="body availability">`, plus
`.availability` + `.ext-link` CSS rules.

Both runs took two `Edit` calls per hunk on average and left every manual-only
region untouched.
