# Iteration-1 review — Claude's notes

Acting as reviewer of the three `with_skill` outputs. I'm comparing them against:

- The existing 15 records in `data.json` (the registry's actual conventions).
- The baseline `without_skill` outputs (what an unguided Claude produces).
- The skill's own promises in `SKILL.md`.

All three records would pass any quantitative check I wrote. The interesting question is style and consistency at scale, which is where the skill earns or doesn't earn its keep. Findings below, ranked by impact.

---

## Findings

### 1. `params` is the most error-prone field — make the rule explicit. **(high impact)**

What I saw across the with-skill outputs:

| Record | with-skill | baseline | reality |
| --- | --- | --- | --- |
| Mamba | `"3B"` | `"2.8B"` | Mamba-3B is officially 2.8B. With-skill rounded; baseline didn't. |
| CLIP | `"~400M"` | `"428M"` | CLIP ships a family (ResNet-50 → ViT-L/14). Both are defensible; neither names the variant. |
| Phi-2 | `"2.7B"` | `"2.7B"` | Both correct. |

The existing registry has precise counts everywhere: `"340M"`, `"3.3B"`, `"1.55B"`, `"~25M"` (the only `~`, for PatchCore — and PatchCore's count actually varies with backbone, so the `~` is warranted). Rounding `2.8B` to `3B` for Mamba breaks that pattern.

**Proposed edit to SKILL.md** — replace the current bullet:

> `params` — parameter count as string with the unit: `"340M"`, `"3.3B"`, `"~25M"`, `"Unknown"`. If the artifact is a dataset rather than a model, use `"N/A"`.

with:

> `params` — parameter count as the source publishes it. Do **not** round (`"2.8B"`, not `"3B"`). Use the `~` prefix only when the source itself is approximate (e.g., a family where the count varies with backbone). For model families that ship multiple sizes (CLIP RN50 → ViT-L/14; CodeLlama 7B/13B/34B), pick the largest released variant and name the variant explicitly in `description`. Use `"Unknown"` only when no source reports a count. Use `"N/A"` only for datasets, not models.

### 2. `task` taxonomy: the skill says "reuse when close" but with-skill invented three new labels. **(high impact)**

Existing `task` labels in `data.json`:
`Text Classification`, `Machine Translation`, `Question Answering`, `Image Captioning`, `Code Generation`, `Object Detection`, `Speech Recognition`, `Semantic Segmentation`, `Text Summarization`, `Protein Structure`, `Molecule Generation`, `Multimodal Reasoning`, `Audio Generation`, `Time Series Forecasting`, `Anomaly Detection`.

What the with-skill outputs picked:
- Mamba → `"Language Modeling"` (new — closest existing: maybe `"Text Classification"`? But neither really fits. New is defensible here.)
- CLIP → `"Zero-Shot Image Classification"` (new — no good existing match. Defensible.)
- Phi-2 → `"Text Generation"` (new — closest: `"Question Answering"` for GPT-4 or `"Code Generation"` for CodeLlama. Phi-2 is a base LM, so neither really fits.)

Honestly all three new labels are reasonable. **The problem isn't the choices; it's that the skill is hiding the existing taxonomy behind a `Read` call.** The model spends tokens fetching `data.json` to find out which labels exist, when those labels are short enough to enumerate inline.

**Proposed edit** — add a section to SKILL.md right above "Inferred fields":

> ### Existing labels — reuse when at all reasonable
>
> Before inventing a new value, check whether one of these fits. The cost of a new label is a permanent split in the registry's vocabulary; the cost of a slightly-loose reuse is near-zero.
>
> **task** (existing): Text Classification · Machine Translation · Question Answering · Image Captioning · Code Generation · Object Detection · Speech Recognition · Semantic Segmentation · Text Summarization · Protein Structure · Molecule Generation · Multimodal Reasoning · Audio Generation · Time Series Forecasting · Anomaly Detection
>
> **domain** (existing): NLP · Multimodal · Code · Computer Vision · Audio · Biology · Chemistry · Time Series · Industrial AI
>
> **ai_system** (closed): model · workflow · agent (see `references/ai_system-examples.md` for which is which).
>
> If you invent a new value, write a one-line rationale in the PR description. That single sentence is what stops the taxonomy from sprawling.

(This list will eventually drift from data.json. A pre-commit hook could regenerate it, but that's a v2 problem.)

### 3. `organization` for multi-affiliation papers needs a sharper rule. **(medium impact)**

The Mamba case: Albert Gu (CMU) and Tri Dao (Princeton). With-skill chose `"Carnegie Mellon University"`. Baseline chose `"CMU & Princeton"`. The skill says "pick the lead author's affiliation" which is what with-skill did — defensible.

But the registry already shows precedent for combined orgs implicitly (none of the 15 use `&`, all are single orgs). So with-skill's choice is more consistent with existing data. Good.

What's missing in the skill: **the arxiv API doesn't return affiliations for most papers** (it didn't for Mamba). The with-skill subagent had to fall back on outside knowledge to say "Gu is at CMU." That's fragile.

**Proposed addition** to SKILL.md, step 1 (Identify the source type), after the arxiv row:

> The arxiv API does not return author affiliations for most papers. If `affiliations` comes back empty and you need it, WebFetch the arxiv abstract page (`https://arxiv.org/abs/<id>`) — affiliations are usually listed in the abstract HTML. As a last resort, fetch the paper's PDF first page or its papers-with-code entry.

### 4. The `language` default of "Python" is OK but could be smarter. **(low impact)**

The skill says language is the reference *implementation* language and defaults to Python. All three with-skill outputs used Python, which is right.

But the GitHub fetch returns the actual detected language (`meta.language` in the script output). For CLIP, GitHub detects `"Jupyter Notebook"` — with-skill correctly overrode that to `"Python"` because the installable package is Python. The skill captured this intuition already in the script comment, but the SKILL.md doesn't mention it.

**Proposed clarification** — under "Inferred fields → language":

> Almost always `"Python"`. The GitHub API may report `"Jupyter Notebook"` if the repo's notebooks outweigh the .py files in bytes — override to `"Python"` when the installable package or training code is Python. Only use a non-Python value when the canonical implementation is non-Python (e.g., a CUDA-only library, a Rust inference engine).

### 5. The PR happy path is untested. **(high impact, but waiting on git init)**

All three with-skill runs correctly detected "not a git repo" and fell back to JSON output. That's the cold-start path working. But the **headline** workflow — the one the user wanted — is "open a PR appending the record to data.json", and that hasn't fired once.

This is a real risk: the SKILL.md mentions branch/commit/push/`gh pr create` but those commands haven't been exercised. Likely failure modes:

- The skill says "edit data.json: insert the new record before the closing ]" — but doesn't say *how*. The model could rewrite the whole file, which would lose comments / change formatting. The current data.json doesn't have comments, but a careless edit might re-indent everything, producing a noisy diff.
- The PR title/body suggestion is one line — should it include a link to the source URL? A summary of the inferred fields so the reviewer can sanity-check at a glance?

**Proposed addition** — a `scripts/append_record.py` that does the edit deterministically:

```py
# usage: append_record.py /path/to/data.json /path/to/new_record.json
# - Reads data.json, parses, appends to records[], re-serialises with the same
#   indent/separator/trailing-newline as the existing file.
# - Exits non-zero if id collision or schema mismatch (missing field).
```

And the SKILL.md PR step becomes:

> Append the record using `scripts/append_record.py /Users/dobleefe/dataland/data.json /tmp/new_record.json`. Do not hand-edit data.json — even a one-line append risks reformatting the whole file.

I'd also enrich the PR body template:

```markdown
**Source**: <source_url>
**Model**: <model>  ·  **Organization**: <organization>  ·  **Year**: <year>
**Inferred fields**: task=<task>, domain=<domain>, architecture=<architecture>, ai_system=<ai_system>
```

Three lines, all the reviewer needs.

### 6. The `description` style guidance is working but worth tightening. **(low impact)**

Lengths:
- with-skill: 472, 372, 293 — all in the 250-500 char band the registry uses.
- baseline: 264, 236, 224 — slightly shorter but still factual.

Both arms write in the right tone (factual, dense, no hype). With-skill's are slightly more verbose. Neither is wrong.

**Optional edit** — add to SKILL.md → `description`:

> Aim for 2–3 sentences, ~250–450 characters. Lead sentence: what it is. Middle: the novel mechanism (one specific claim, not a list). Closing: a quantitative result or scope, if reported. Match nearby records' density — terse is the house style.

### 7. The skill currently triggers fine but the description has redundancy. **(cosmetic)**

Current description (~110 words):

> Use when the user pastes a URL (arxiv, GitHub, papers-with-code, Nature, HuggingFace, OpenReview, project page, etc.) and wants to add it to the dataland data.json registry. Fetches the URL, extracts metadata, infers missing fields (domain from abstract, ai_system as model/workflow/agent), builds a record in the long-key schema, and opens a pull request appending it to /Users/dobleefe/dataland/data.json. Triggers on phrases like "add this paper", "log this model", "register this dataset", "add this to the registry/datahub", "new record from <url>", or any time a research URL is dropped in the context of growing the registry. Strongly prefer using this skill — guessing fields by eye produces inconsistent records.

This is good. After making the substantive edits above, run `skill-creator`'s `run_loop.py` to tune the description against trigger-eval queries.

---

## Suggested order of operations for the next iteration

1. **Apply edits 1–4** (params rule, taxonomy enumeration, affiliation fallback, language clarification) — they're small text changes to SKILL.md and one reference doc.
2. **Add `scripts/append_record.py`** — small Python script, ~30 lines, deterministic file edit.
3. **Update SKILL.md PR step** to use the script and the enriched PR body template.
4. **Then**: `git init` the dataland repo, add a real GitHub remote, and rerun **one** eval (say, Mamba) to exercise the full PR happy path end-to-end.
5. **Then**: run iteration-2 of all three evals with the updated skill, compare records to iteration-1 — focus on `params`, `task`, `organization` consistency.

Edits 1–4 are roughly 30 minutes of work and will close most of the gap I saw. Edit 5 (testing the PR path) is the riskiest unknown remaining.

---

## What I would NOT change

- The script-based fetcher for arxiv/github/hf — it's the single biggest reason the with-skill records are consistent. Keep it.
- The `ai_system` reference doc — three with-skill runs picked sensible values (`model` x 3). The doc is doing its job.
- The no-git-repo fallback — worked correctly on three out of three runs.
- The overall skill length — SKILL.md is ~140 lines, well under the 500-line guidance, with the bulk of detail factored into references. Don't bloat it.
