---
name: url-to-dataset-record
description: Use when the user pastes a HuggingFace dataset URL and wants to add it to the dataland data.json registry. Fetches the dataset card, extracts metadata, builds a record matching the registry's top-level vocabularies (extending them when needed), and opens a pull request appending it to /Users/dobleefe/dataland/data.json. Primary path is HuggingFace datasets — single-dataset URLs and collections both supported; HF model URLs and arxiv/github URLs are secondary edge cases. Triggers on phrases like "add this dataset", "log this hf dataset", "register this collection", "add this to the datahub/registry", "new record from <hf datasets url>", or any time a HuggingFace datasets URL appears in the context of growing the registry. Strongly prefer using this skill — guessing fields by eye produces inconsistent records.
---

# URL → Dataset Record

> **Scope.** This skill is focused on **HuggingFace datasets** (`huggingface.co/datasets/<owner>/<name>`) — that's the primary path. Collections that bundle datasets work too. HF model pages, arxiv, and GitHub are supported as fallbacks for the rare model record, but the dominant use case is dataset ingestion.

Build a canonical record from a HuggingFace dataset URL and open a PR appending it to `/Users/dobleefe/dataland/data.json`.

**Canonical example throughout this skill:** `https://huggingface.co/datasets/ylacombe/google-argentinian-spanish` — a Google-sourced Argentinian Spanish speech corpus republished on HF by user `ylacombe`. References to "the example" below mean this URL.

## The schema in one breath

The registry has no separate ontology file — the vocabularies are declared at the top of `data.json` itself. Every record field must reference a value that exists in the corresponding vocabulary list, or the validator rejects the commit.

```jsonc
{
  "tasks_supported":   [ "classify","extract","transcribe","summarize","retrieve_information","reason","chat","voice" ],
  "input_types":       [ "text","image","audio","video","code" ],
  "domains":           [ "general","medical","legal","finance" ],
  "languages":         [ "es-AR","es-BO","es-CL", ... "pt-BR","qu","gn","ay","en","Multilingual","N/A" ],  // LATAM-focused
  "ai_systems":        [ "model","workflow","agent","node","dataset" ],
  "architectures":     [ ... ],
  "licenses":          [ ... ],
  "contributing_organizations": [ { "name": "...", "logo": null }, ... ],

  "records": [ { id, task, input_type, domain, language, ai_system, architecture,
                 organization, license, model, params, year, source_url, description } ]
}
```

Key semantics:

- `task` is a **verb** (the action: `transcribe`, `classify`, `summarize`).
- `input_type` is the **medium** the action is performed on (`audio`, `text`, `image`).
- `domain` is a **knowledge grouping** (`general`, `medical`, `legal`, `finance`) — not a technical bucket like "NLP" or "Computer Vision".
- `language` is a **LATAM-focused** natural-language tag. Regional codes (`es-AR`, `pt-BR`) are preferred over plain `es` / `pt`. There is no `es` or `pt` in the vocabulary — every Spanish-speaking LATAM country has its own variant. Use `en` / `Multilingual` / `N/A` only when the artifact truly is English-only / multi-language / non-linguistic.
- `ai_system` is the artifact kind. For HF datasets, this is **always `dataset`**.

## Workflow

### 1. Fetch the metadata

```sh
python3 .claude/skills/url-to-dataset-record/scripts/fetch_metadata.py hf-dataset ylacombe/google-argentinian-spanish
```

That returns the dataset card as JSON: `cardData`, `tags`, `task_categories`, `modalities`, `language`, `license`, `createdAt`, and the README text. Use this — it's deterministic and clean.

For a **collection URL** (`huggingface.co/collections/<owner>/<slug>`), call `.claude/skills/url-to-dataset-record/scripts/fetch_metadata.py hf-collection <url>` first to expand into `items[]`, show the user the title + summary + item list, ask which subset to import, then call `hf-dataset` per confirmed item. Skip `paper` and `space` items.

If the script path doesn't apply (rare — for a non-HF dataset URL), `WebFetch` the page and extract manually.

### 2. Read the current registry

Read `/Users/dobleefe/dataland/data.json` once. You need:

1. **The current vocabularies** — `tasks_supported`, `input_types`, `domains`, `languages`, `ai_systems`, `architectures`, `licenses`, `contributing_organizations`. These are the only legal values for the matching record fields.
2. **The next id** — `max(records[].id) + 1`.
3. **Tone calibration** — skim 2–3 existing records. `description` is 2–3 dense factual sentences (~250–450 chars) with an interesting quantitative scope (hours of audio, number of examples, languages covered). Match that tone.

### 3. Build the record

Mapping from HF dataset metadata onto the registry schema:

| Field | How to fill |
| --- | --- |
| `id` | `max(records[].id) + 1` |
| `task` | A verb from `tasks_supported`. Map the dataset's headline use to the closest existing verb: speech corpora → `transcribe`; labeled text corpora → `classify`; QA corpora → `retrieve_information`; long-doc/summarization corpora → `summarize`. If no existing verb fits, propose adding one (see § 4). |
| `input_type` | The medium, from `input_types`. Audio dataset → `audio`. Image dataset → `image`. Text dataset → `text`. Etc. |
| `domain` | A knowledge grouping from `domains`. **Default is `general`** for any open-domain corpus. Use `medical`, `legal`, or `finance` only when the dataset's content is explicitly that domain. |
| `language` | A value in `languages`. **For LATAM speech and text corpora, use the regional code** (`es-AR`, `es-MX`, `pt-BR`, `qu`). Country-specific data → country code; truly multi-language datasets → `Multilingual`; non-linguistic data → `N/A`. There is no `es` or `pt` — every Spanish-speaking country has its own code. **If your dataset's regional code is missing from the vocabulary, add it.** |
| `ai_system` | **Always `"dataset"` for this skill's records.** |
| `architecture` | For datasets, a short modality + format descriptor: `"Audio + Text (parquet)"`, `"Text (parquet)"`, `"Image + Text (webdataset)"`. The column is narrow — keep it under ~30 chars. Add to `architectures` if a new descriptor is needed. |
| `organization` | The dataset's **upstream source**, not the HF account holder. For `ylacombe/google-argentinian-spanish`, that's `Google` (the original corpus owner) — not `ylacombe`. The card's README usually names the upstream source explicitly. If only the HF user is identifiable, use that. **Must match a `name` in `contributing_organizations` — add an entry `{ "name": "...", "logo": null }` if missing.** |
| `license` | A value in `licenses` (normalize via `references/license-table.md`). Source order of preference: `cardData.license` → `license_tag` → README. Add to `licenses` if a new short form is needed. |
| `model` | The dataset's display name verbatim — `cardData.pretty_name` if set, otherwise the `name` portion of the HF id (`"google-argentinian-spanish"`). Yes, the field is called `model`; treat it as the artifact's name regardless of kind. |
| `params` | `"N/A"` — datasets don't have parameters. The example count belongs in `description`, not here. |
| `year` | First-release year as an int. Use the year of the upstream corpus (from the README) if it predates the HF upload; otherwise `createdAt` year. |
| `source_url` | The user's URL verbatim, strip tracking params. |
| `description` | 2–3 dense factual sentences. What's in it, how it was collected, an interesting quantitative scope (hours of audio, number of speakers, geographic coverage, dialect distribution). Match the registry's terse tone — no marketing language. |

### Worked example: `ylacombe/google-argentinian-spanish`

A plausible final record (the exact values come from the fetched metadata — this shows the shape):

```json
{
  "id": 6,
  "task": "transcribe",
  "input_type": "audio",
  "domain": "general",
  "language": "es-AR",
  "ai_system": "dataset",
  "architecture": "Audio + Text (parquet)",
  "organization": "Google",
  "license": "CC-BY-SA 4.0",
  "model": "google-argentinian-spanish",
  "params": "N/A",
  "year": 2020,
  "source_url": "https://huggingface.co/datasets/ylacombe/google-argentinian-spanish",
  "description": "Crowd-sourced read-speech corpus of Argentinian Spanish from Google — short utterances paired with transcripts, originally released to enable LATAM-targeted TTS and ASR research. The HF mirror packages the original Google distribution into parquet shards for streaming."
}
```

Note the vocabulary touches this single record requires:

- `es-AR` is already in `languages` ✓
- `Google` may need to be added to `contributing_organizations`.
- `transcribe`, `audio`, `general`, `dataset` are already in their vocabularies ✓
- `Audio + Text (parquet)` likely needs to be added to `architectures`.
- `CC-BY-SA 4.0` may need to be added to `licenses` (depending on the current list).

Surface every one of these vocabulary touches in the PR body so the reviewer can see what's new.

### 4. Confirm with the user before opening a PR

PRs are visible and irreversible. Show:

- The proposed record as a JSON block.
- **Any vocabulary additions** the record requires — every new entry in `architectures` / `licenses` / `contributing_organizations` / (rarely) `tasks_supported` / `languages`. List each one explicitly.
- The proposed PR title and body.

Wait for approval.

### 5. Open the PR

```sh
cd /Users/dobleefe/dataland
git checkout -b add-<slug>          # slug = lowercase artifact name, dashed
# 1. edit data.json: insert vocabulary additions first (alphabetical within each list)
# 2. append the record at the end of `records`
node scripts/validate-data.mjs       # MUST exit 0 before committing
git add data.json
git commit -m "Add <artifact name> to dataset registry"
git push -u origin add-<slug>
gh pr create --title "Add <artifact name>" --body "$BODY"
```

If `scripts/install-hooks.sh` has been run locally, the pre-commit hook runs the validator automatically. The Cloudflare Pages build also fails on validator errors.

PR body template:

```markdown
**Source**: <source_url>
**Artifact**: <model>  ·  **Organization**: <organization>  ·  **Year**: <year>
**Inferred fields**: task=<task>, input_type=<input_type>, domain=<domain>, language=<language>, ai_system=dataset
**Vocabulary additions**: <list each new entry, or "none">
```

Report the PR URL back to the user.

## Secondary paths

The skill is dataset-first, but a few non-dataset URLs are also accepted as edge cases. Use the same workflow with these tweaks:

- **HF model** (`huggingface.co/<owner>/<model>`): `ai_system` becomes `model` / `workflow` / `agent` depending on character (see § *ai_system semantics* below). `params` is the published count (`"340M"`, `"2.8B"`, no rounding). `architecture` is a model-architecture noun phrase (`"Transformer (Encoder)"`, `"Vision-Language"`). Use `.claude/skills/url-to-dataset-record/scripts/fetch_metadata.py hf <owner>/<model>`.
- **arxiv** (`arxiv.org/abs/...`): `.claude/skills/url-to-dataset-record/scripts/fetch_metadata.py arxiv <id>`. Affiliations are often missing — `WebFetch` the abstract page or the project's papers-with-code entry to recover `organization`.
- **GitHub repo** (`github.com/<owner>/<repo>`): `.claude/skills/url-to-dataset-record/scripts/fetch_metadata.py github <owner>/<repo>`. Often a code companion to a paper — usually adds an existing record's `source_url` rather than a new record.

### `ai_system` semantics

The closed enum is `model`, `workflow`, `agent`, `node`, `dataset`. Pick the one that fits the headline claim:

- **`dataset`** — a data corpus (HF dataset, manually curated benchmark, scraped collection). `params` is `"N/A"`. **The dominant value for this skill.**
- **`model`** — a single trained network, single forward pass, well-defined I/O (BERT, YOLOv8, SAM, BLIP-2).
- **`workflow`** — a pipeline of multiple components, or a model with non-trivial inference (Whisper-large-v3, AlphaFold 3, PatchCore).
- **`agent`** — instruction-tuned, designed to be driven by prompts and chosen actions (GPT-4, CodeLlama, LLaVA).
- **`node`** — semantics TBD; confirm with the user before using.

## Anti-patterns

- **Don't write `task` as a noun phrase** (`"Speech Recognition"`, `"Text Classification"`). Tasks are verbs. The action goes in `task`; the medium goes in `input_type`.
- **Don't conflate `domain` with modality.** `domain` is a knowledge grouping (medical, legal, finance). Open-domain corpora are `general`.
- **Don't fall back to plain `es` or `pt`.** Use the regional code (`es-AR`, `pt-BR`). If the country/region is unclear from the source, ask the user — don't guess.
- **Don't use the HF account holder as `organization` when the upstream source is named.** For `ylacombe/google-argentinian-spanish`, organization is `Google`, not `ylacombe`. Read the README.
- **Don't bury the source.** `source_url` is the URL the user gave you, minus tracking params.
- **Don't add a record without surfacing vocabulary additions.** Every new entry in `tasks_supported` / `languages` / `architectures` / `licenses` / `contributing_organizations` must appear in the PR body so the reviewer sees it.
- **Don't open a PR without confirming.** Always show the JSON first.
- **Don't refactor `data.json` while appending.** Touch only what's necessary: the new record and any vocabulary entries it requires.
- **Don't round `params`** when the rare model record appears. `"2.8B"` is not `"3B"`.

## Reference material

- `references/license-table.md` — short-form mapping for common licenses.
- `references/ai_system-examples.md` — concrete examples (note: may still describe an older closed-enum set).
- `references/no-git-repo.md` — fallback when the repo isn't ready for a PR.
- `references/extraction-tips.md` — extracting fields from messy HTML when no API is available.
