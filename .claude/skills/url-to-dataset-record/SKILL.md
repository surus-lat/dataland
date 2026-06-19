---
name: url-to-dataset-record
description: Use when the user pastes a HuggingFace dataset URL (or another dataset URL like Mozilla Data Collective) and wants to add it to the dataland data.json registry. Fetches the dataset card, extracts metadata, builds a record matching the registry's top-level vocabularies (extending them when needed), and opens a pull request appending it to /Users/dobleefe/dataland/data.json. The registry is **datasets only** — every record describes a corpus, not a model or agent. Triggers on phrases like "add this dataset", "log this hf dataset", "register this collection", "add this to the datahub/registry", "new record from <dataset url>", or any time a dataset URL appears in the context of growing the registry. Strongly prefer using this skill — guessing fields by eye produces inconsistent records.
---

# URL → Dataset Record

> **Scope.** The dataland registry is a catalog of **datasets** — corpora intended for training or evaluating AI systems. Every record describes a dataset. This skill handles HuggingFace datasets (primary path), Mozilla Data Collective, and any other dataset URL. Model pages, agent pages, and benchmarks are out of scope: if a URL describes a model or an agent, refuse and ask the user for a dataset URL instead.

Build a canonical record from a dataset URL and open a PR appending it to `/Users/dobleefe/dataland/data.json`.

**Canonical example throughout this skill:** `https://huggingface.co/datasets/ylacombe/google-argentinian-spanish` — a Google-sourced Argentinian Spanish speech corpus republished on HF by user `ylacombe`. References to "the example" below mean this URL.

## The schema in one breath

The registry has no separate ontology file — the vocabularies are declared at the top of `data.json` itself. Every record field must reference a value that exists in the corresponding vocabulary list, or the validator rejects the commit.

```jsonc
{
  "tasks_supported": [ "transcribe", ... ],       // verbs the dataset is used for
  "input_type":      [ "audio", "text", ... ],    // medium fed in
  "output_type":     [ "text", "audio", ... ],    // medium the trained system produces
  "domains":         [ "general", "medical", "legal", "finance" ],
  "languages":       [ "es-AR","es-BO","es-CL", ... "pt-BR","qu","gn","ay","en","Multilingual","N/A" ],  // LATAM-focused
  "licenses":        [ "CC0", "CC-BY-SA 4.0", "GPL-3.0", ... ],
  "contributing_organizations": [ { "name": "...", "logo": null }, ... ],

  "records": [ { id, task, input_type, output_type, domain, languages[],
                 organization, license, model, year, source_url, description } ]
}
```

Key semantics:

- Every record IS a dataset. There is no `ai_system` field — that question was removed because it was always "dataset".
- There is no `architecture` field. Model architecture has no meaning for raw data, and dataset format details belong in `description`.
- `task` is a **verb** — the action the dataset trains or evaluates (`transcribe`, etc.).
- `input_type` is the medium consumed (`audio` for ASR corpora).
- `output_type` is the medium the trained system produces (`text` for ASR corpora).
- `domain` is a **knowledge grouping** (`general`, `medical`, `legal`, `finance`) — not a technical bucket like "NLP" or "Computer Vision".
- `languages` is an **array** of LATAM-focused natural-language tags. Regional codes (`es-AR`, `pt-BR`) are preferred when the source actually says which country/region the data covers. The coarse codes `es` and `pt` are reserved as fallbacks for when the source mentions Spanish or Portuguese but doesn't resolve sub-variants. `Multilingual` is reserved for datasets that span multiple different *languages* (not just multiple Spanish variants). Use `N/A` only when the corpus is genuinely non-linguistic.
- `model` is the field name for the dataset's display name. (Yes, the field is called `model` — legacy. Treat it as the artifact's name.)

## Workflow

### 1. Fetch the metadata

For HF datasets:

```sh
python3 .claude/skills/url-to-dataset-record/scripts/fetch_metadata.py hf-dataset ylacombe/google-argentinian-spanish
```

Returns the dataset card as JSON: `cardData`, `tags`, `task_categories`, `modalities`, `language`, `license`, `createdAt`, and the README text. Use this — it's deterministic and clean.

For a **collection URL** (`huggingface.co/collections/<owner>/<slug>`), call `.claude/skills/url-to-dataset-record/scripts/fetch_metadata.py hf-collection <url>` first to expand into `items[]`, show the user the title + summary + item list, ask which subset to import, then call `hf-dataset` per confirmed item. Skip `paper` and `space` items.

For non-HF dataset URLs (e.g. Mozilla Data Collective), **invoke the `/scrape` skill** to pull the page's metadata. `/scrape` renders the page in a headless browser, which handles JavaScript-rendered dataset cards that `WebFetch` can't see. Use `WebFetch` only as a last-resort fallback when `/scrape` isn't available.

### 2. Read the current registry

Read `/Users/dobleefe/dataland/data.json` once. You need:

1. **The current vocabularies** — `tasks_supported`, `input_type`, `output_type`, `domains`, `languages`, `licenses`, `contributing_organizations`. These are the only legal values for the matching record fields.
2. **The next id** — `max(records[].id) + 1`.
3. **Tone calibration** — skim 2–3 existing records. `description` is 2–3 dense factual sentences (~250–450 chars) with an interesting quantitative scope (hours of audio, number of speakers, number of utterances, geographic coverage). Match that tone.

### 3. Build the record

Mapping from dataset metadata onto the registry schema:

| Field | How to fill |
| --- | --- |
| `id` | `max(records[].id) + 1` |
| `task` | A verb from `tasks_supported`. Speech corpora → `transcribe`. If no existing verb fits, propose adding one. |
| `input_type` | The medium consumed. ASR/TTS corpora → `audio`. Text corpora → `text`. |
| `output_type` | The medium the trained system produces. ASR → `text`. TTS → `audio`. Translation → `text`. |
| `domain` | A knowledge grouping from `domains`. **Default is `general`** for any open-domain corpus. Use `medical`, `legal`, or `finance` only when the dataset's content is explicitly that domain. |
| `languages` | **An array of values from `languages` vocabulary.** The field is plural and always an array, even when a single value applies. Resolution rule: list every specific sub-variant the dataset's page reports (e.g. PRESEEA lists 11 LATAM countries → list all 11 country codes). Only fall back to a coarse code (`es`, `pt`) when sub-variant resolution is **not stated** on the source page. Reserve `Multilingual` for datasets spanning multiple **different** languages (Spanish + Portuguese + Quechua, etc.), not just multiple Spanish variants. Use `N/A` only when the data is genuinely non-linguistic. **The point of the array is so a contributor can see at a glance whether their variant of interest is covered** — don't collapse known specifics into `es`. |
| `organization` | The dataset's **upstream source**, not the HF account holder. For `ylacombe/google-argentinian-spanish`, that's `Google` — not `ylacombe`. The card's README usually names the upstream source explicitly. If only the HF user is identifiable, use that. **Must match a `name` in `contributing_organizations` — add an entry `{ "name": "...", "logo": null }` if missing.** |
| `license` | A value in `licenses` (normalize via `references/license-table.md`). Source order of preference: `cardData.license` → `license_tag` → README. Add to `licenses` if a new short form is needed. |
| `model` | The dataset's display name verbatim — `cardData.pretty_name` if set, otherwise the `name` portion of the HF id (`"google-argentinian-spanish"`). Yes, the field is called `model`; treat it as the dataset's display name. |
| `year` | First-release year as an int. Use the year of the upstream corpus (from the README) if it predates the HF upload; otherwise `createdAt` year. |
| `source_url` | The user's URL verbatim, strip tracking params. |
| `description` | 2–3 dense factual sentences. What's in it, how it was collected, an interesting quantitative scope (hours of audio, number of speakers, geographic coverage, dialect distribution). Include format details (parquet, MP3, WAV, TSV) here — they used to live in a separate `architecture` field but now belong in the prose. Match the registry's terse tone — no marketing language. |

### Worked example: `ylacombe/google-argentinian-spanish`

A plausible final record (the exact values come from the fetched metadata — this shows the shape):

```json
{
  "id": 7,
  "task": "transcribe",
  "input_type": "audio",
  "output_type": "text",
  "domain": "general",
  "languages": ["es-AR"],
  "organization": "Google",
  "license": "CC-BY-SA 4.0",
  "model": "google-argentinian-spanish",
  "year": 2020,
  "source_url": "https://huggingface.co/datasets/ylacombe/google-argentinian-spanish",
  "description": "Crowd-sourced read-speech corpus of Argentinian Spanish from Google — short utterances paired with transcripts, originally released to enable LATAM-targeted TTS and ASR research. Splits cover 3,921 female and 1,818 male recordings, packaged by the HF mirror into parquet shards for streaming."
}
```

Vocabulary touches this record requires:

- `es-AR` is already in `languages` ✓
- `Google` may need to be added to `contributing_organizations`.
- `transcribe`, `audio`, `text`, `general` are already in their vocabularies ✓
- `CC-BY-SA 4.0` may need to be added to `licenses`.

### Sub-language resolution: worked examples

| Dataset signal on the page | `languages` value | Why |
| --- | --- | --- |
| "Argentinian Spanish" / "Buenos Aires speakers" | `["es-AR"]` | Country-specific |
| PRESEEA: "Argentina, Bolivia, Chile, Colombia, Cuba, Ecuador, Guatemala, Mexico, Peru, Uruguay, Venezuela" | `["es-AR", "es-BO", "es-CL", "es-CO", "es-CU", "es-EC", "es-GT", "es-MX", "es-PE", "es-UY", "es-VE"]` | List every country named |
| CV: "Mexican, Andean, Rioplatense, Caribbean, Central American, Chilean…" | List every LATAM country those accent groups cover | Map each accent group to its constituent country codes |
| "Spanish, 16 speakers, breakdown not reported" | `["es"]` | Coarse fallback — sub-variants unknown |
| "Spanish, regional variants present but not coded per-speaker" (VoxForge) | `["es"]` | Coarse fallback — resolution explicitly absent |
| "Spanish + Portuguese + Quechua mixed corpus" | `["es", "pt-BR", "qu"]` or `["Multilingual"]` if no breakdown | Multiple languages → list them; if no breakdown, use `Multilingual` |
| Code or audio-only data with no spoken language | `["N/A"]` | Non-linguistic |

**Accent → country mapping cheat sheet** (use only the countries actually claimed by the source; don't over-extend):

- *Mexican* → es-MX
- *Andean* → es-PE, es-BO, es-EC, es-CO
- *Rioplatense* → es-AR, es-UY (and sometimes es-PY)
- *Caribbean* → es-CU, es-DO, es-PR, es-VE
- *Chilean* → es-CL
- *Central American* → es-CR, es-GT, es-HN, es-NI, es-PA, es-SV
- *Castilian / peninsular / Canary* → not in this LATAM-first registry — drop these from the array; if all you have is peninsular, the dataset isn't a LATAM fit

Surface every one of these vocabulary touches in the PR body so the reviewer can see what's new.

### 4. Confirm with the user before opening a PR

PRs are visible and irreversible. Show:

- The proposed record as a JSON block.
- **Any vocabulary additions** the record requires — every new entry in `licenses` / `contributing_organizations` / (rarely) `tasks_supported` / `input_type` / `output_type` / `languages`. List each one explicitly.
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
**Inferred fields**: task=<task>, input_type=<input_type>, output_type=<output_type>, domain=<domain>, languages=<languages>
**Vocabulary additions**: <list each new entry, or "none">
```

Report the PR URL back to the user.

## Non-dataset URLs

If the user pastes a model card (`huggingface.co/<owner>/<model>`), an arxiv paper, a GitHub repo, or any other URL that doesn't describe a dataset, **refuse and ask for a dataset URL**. The registry is datasets-only. There is no `ai_system` field to switch on.

## Anti-patterns

- **Don't add `ai_system` or `architecture` fields.** They were removed from the schema. Every record IS a dataset; the validator will reject any record carrying those fields.
- **Don't accept non-dataset URLs.** Model cards, agent pages, benchmark leaderboards — refuse and ask the user for a dataset URL.
- **Don't write `task` as a noun phrase** (`"Speech Recognition"`, `"Text Classification"`). Tasks are verbs. The action goes in `task`; the medium goes in `input_type`/`output_type`.
- **Don't conflate `domain` with modality.** `domain` is a knowledge grouping (medical, legal, finance). Open-domain corpora are `general`.
- **Don't fall back to `es` / `pt` when the source names specific countries.** Read the page carefully — if it lists "Argentinian, Mexican, Chilean…" then list `es-AR`, `es-MX`, `es-CL`. Coarse `es` / `pt` is only for when the page genuinely doesn't resolve sub-variants.
- **Don't use `Multilingual` for Spanish-only-but-multi-country data.** `Multilingual` means multiple distinct languages (Spanish + Portuguese + Quechua); a pan-Hispanic corpus is `["es", ...]` or a list of country codes.
- **Don't use the HF account holder as `organization` when the upstream source is named.** For `ylacombe/google-argentinian-spanish`, organization is `Google`, not `ylacombe`. Read the README.
- **Don't bury the source.** `source_url` is the URL the user gave you, minus tracking params.
- **Don't add a record without surfacing vocabulary additions.** Every new entry in `tasks_supported` / `languages` / `licenses` / `contributing_organizations` must appear in the PR body so the reviewer sees it.
- **Don't open a PR without confirming.** Always show the JSON first.
- **Don't refactor `data.json` while appending.** Touch only what's necessary: the new record and any vocabulary entries it requires.

## Reference material

- `references/license-table.md` — short-form mapping for common licenses.
- `references/no-git-repo.md` — fallback when the repo isn't ready for a PR.
- `references/extraction-tips.md` — extracting fields from messy HTML when no API is available.
