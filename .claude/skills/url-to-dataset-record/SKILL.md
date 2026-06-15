---
name: url-to-dataset-record
description: Use when the user pastes a HuggingFace URL (model, dataset, or collection) — or any research URL — and wants to add it to the dataland data.json registry. Fetches the URL, extracts metadata, builds one or more records matching the registry's top-level vocabularies, and opens a pull request appending them to /Users/dobleefe/dataland/data.json. HuggingFace is the primary supported source today (arxiv and GitHub also work). Triggers on phrases like "add this model", "log this dataset", "register this hf collection", "add this to the registry/datahub", "new record from <hf url>", or any time a HuggingFace URL is dropped in the context of growing the registry. Strongly prefer using this skill — guessing fields by eye produces inconsistent records.
---

# URL → Dataset Record

> **In flux.** The registry's schema recently changed: vocabularies are now declared at the top of `data.json` itself, `task` is a verb (not a noun phrase), and `input_type` is a separate field. The fetcher scripts under `scripts/` were written against the old schema — treat their output as raw metadata to map, not as a finished record. If you spot a mismatch between this skill and `data.json`, **trust `data.json`**.

Build canonical records from a source URL and open a PR appending them to the dataland registry. The registry's source of truth is `/Users/dobleefe/dataland/data.json`.

**Primary supported source: HuggingFace.** Models, datasets, and collections all have first-class extraction paths. Arxiv and GitHub also work but are secondary.

## The schema in one breath

```jsonc
{
  "tasks_supported":   [ ... verbs ... ],         // e.g. classify, transcribe, summarize
  "input_types":       [ "text","image","audio","video","code" ],
  "domains":           [ "general","medical","legal","finance","scientific" ],
  "languages":         [ "en","Multilingual","N/A" ],
  "ai_systems":        [ "model","workflow","agent","node" ],
  "architectures":     [ ... ],
  "licenses":          [ ... ],
  "contributing_organizations": [ { "name": "...", "logo": null }, ... ],

  "records": [ { id, task, input_type, domain, language, ai_system, architecture,
                 organization, license, model, params, year, source_url, description } ]
}
```

The structure *is* the ontology — every record field's value must already exist in the corresponding top-level list. If it doesn't, **you must add it to the list before adding the record**, or the validator (`node scripts/validate-data.mjs`) will reject the commit and the Cloudflare Pages build.

`task` is a verb (the action). `input_type` is what the action is performed on. `domain` is a knowledge grouping (general / medical / legal / finance / scientific), **not** a technical bucket like "NLP" or "Computer Vision". `language` is the artifact's natural language (or `N/A` for non-linguistic modalities like vision / pure audio / structural biology).

## Workflow

### 1. Identify the source type

| URL pattern | Extractor | Notes |
| --- | --- | --- |
| `huggingface.co/datasets/<owner>/<name>` | `scripts/fetch_metadata.py hf-dataset <owner>/<name>` | dataset |
| `huggingface.co/collections/<owner>/<slug>` | `scripts/fetch_metadata.py hf-collection <url>` | collection — expands to N records |
| `huggingface.co/<owner>/<model>` | `scripts/fetch_metadata.py hf <owner>/<model>` | model |
| `arxiv.org/abs/...` or `arxiv.org/pdf/...` | `scripts/fetch_metadata.py arxiv <id>` | paper |
| `github.com/<owner>/<repo>` | `scripts/fetch_metadata.py github <owner>/<repo>` | repo |
| anything else | WebFetch the page and extract | best-effort |

Run the script when applicable — the returned JSON gives you raw metadata to map.

### 2. Read the current registry

Read `/Users/dobleefe/dataland/data.json` once. You need:

1. **The current vocabularies** — `tasks_supported`, `input_types`, `domains`, `languages`, `ai_systems`, `architectures`, `licenses`, `contributing_organizations`. These are the only legal values for the matching record fields.
2. **The next id** — `max(records[].id) + 1`.
3. **A style calibration** — skim 2–3 existing records. `description` is 2–3 dense factual sentences (~250–450 chars), `params` is the published count without rounding (`"340M"`, `"2.8B"`, not `"3B"`), licenses use the canonical short forms already in `licenses`.

### 3. Build the record

Map the fetched metadata onto the fields below.

| Field | How to fill |
| --- | --- |
| `id` | `max(records[].id) + 1` |
| `task` | A verb in `tasks_supported`. Map the source's headline use to the closest existing verb. **If no existing verb fits, propose adding one to `tasks_supported`** as part of the PR (see § 5). |
| `input_type` | What the task is performed on, drawn from `input_types`. For a speech model → `audio`; an image classifier → `image`; a text summarizer → `text`. If your source operates on something outside the list (e.g. time-series, protein, molecule), propose adding to `input_types` or skip the record. |
| `domain` | A knowledge grouping from `domains` — `general` unless the artifact is specifically `medical`, `legal`, `finance`, or `scientific`. |
| `language` | A value in `languages`. `en` for English-only artifacts, `Multilingual` for multi-language ones (NLLB-200, Whisper, GPT-4), `N/A` for non-linguistic artifacts (vision-only, audio synthesis, structural biology). |
| `ai_system` | A value in `ai_systems` — see § 4. |
| `architecture` | A short noun phrase from `architectures` (e.g. `"Transformer (Encoder)"`, `"Vision-Language"`). Add a new architecture to the list if needed. |
| `organization` | The lead author's / model owner's affiliation. **Must match a `name` in `contributing_organizations`**. If the org isn't yet listed, add an entry `{ "name": "...", "logo": null }` to `contributing_organizations` as part of the same change. |
| `license` | A value in `licenses` (normalize via `references/license-table.md`). Add to the list if needed. |
| `model` | The artifact's display name verbatim — `"BERT-large"`, `"Whisper-large-v3"`, etc. The field is called `model` regardless of whether the artifact is a model, workflow, or dataset. |
| `params` | Published count, verbatim, no rounding (`"2.8B"`, not `"3B"`). `"N/A"` for datasets. |
| `year` | First-release year as an int. |
| `source_url` | The user's URL verbatim (strip tracking params; `arxiv.org/pdf/<id>` → `arxiv.org/abs/<id>`). |
| `description` | 2–3 dense factual sentences. What it is, how it was built, an interesting quantitative scope. Match the registry's terse tone. |

### 4. `ai_system` — closed enum

Currently the legal values are `model`, `workflow`, `agent`, `node`. Read `data.json` for the current list — this enum has expanded recently.

- **`model`** — a single trained network, single forward pass, well-defined I/O (BERT, YOLOv8, SAM, BLIP-2).
- **`workflow`** — a pipeline of multiple components, or a model with non-trivial inference (Whisper-large-v3, AlphaFold 3, PatchCore).
- **`agent`** — instruction-tuned, driven by prompts and chosen actions (GPT-4, CodeLlama, LLaVA).
- **`node`** — (newly added; semantics to confirm with the user).

`references/ai_system-examples.md` may still reference an older `"dataset"` value — that has been removed from the closed enum. Don't use it.

### 5. Confirm with the user before opening a PR

PRs are visible and irreversible. Show:

- The proposed record(s) as a JSON block.
- **Any vocabulary additions** the record requires — if `task` needs a new verb, if `organization` needs a new entry in `contributing_organizations`, etc. List each one explicitly so the user can correct or veto.
- The proposed PR title.

Wait for approval.

### 6. Open the PR

```sh
cd /Users/dobleefe/dataland
git checkout -b add-<slug>
# 1. edit data.json: insert any new vocabulary entries needed
# 2. append the record(s) at the end of `records`
node scripts/validate-data.mjs   # must exit 0 before committing
git add data.json
git commit -m "Add <artifact name> to dataset registry"
git push -u origin add-<slug>
gh pr create --title "Add <artifact name>" --body "$BODY"
```

If `scripts/install-hooks.sh` has been run locally, the pre-commit hook runs the validator automatically.

PR body template:

```markdown
**Source**: <source_url>
**Artifact**: <model>  ·  **Organization**: <organization>  ·  **Year**: <year>
**Inferred fields**: task=<task>, input_type=<input_type>, domain=<domain>, language=<language>, ai_system=<ai_system>
**Vocabulary additions**: <list any new entries added to tasks_supported / contributing_organizations / etc., or "none">
```

## Anti-patterns

- **Don't invent vocabulary values silently.** Adding a new task verb, a new architecture, or a new organization is a real schema change — surface it in the PR description and confirm with the user before pushing.
- **Don't write `task` as a noun phrase** (`"Text Classification"`, `"Speech Recognition"`). Tasks are verbs. The action lives in `task`; the medium lives in `input_type`.
- **Don't conflate `domain` with modality.** `domain` is a knowledge area (medical, legal, finance), not a technical bucket (`NLP`, `Computer Vision`). Most general-purpose artifacts are `domain: "general"`.
- **Don't use `language: "Python"` or any programming language.** `language` is the natural language of the artifact's data.
- **Don't refactor `data.json` while appending.** Touch only what's necessary: the new record(s), and any vocabulary list entries those records require.
- **Don't round `params`.** `"2.8B"` is not `"3B"`.
- **Don't open a PR without confirming.** Always show the JSON first.

## Reference material

- `references/license-table.md` — short-form mapping for common licenses.
- `references/ai_system-examples.md` — concrete examples (note: predates the `node` value and may still list `dataset`).
- `references/no-git-repo.md` — fallback when the repo isn't ready for a PR.
- `references/extraction-tips.md` — extracting fields from messy HTML when no API is available.
