---
name: url-to-dataset-record
description: Use when the user pastes a HuggingFace URL (model, dataset, or collection) — or any research URL — and wants to add it to the dataland data.json registry. Fetches the URL, extracts metadata, infers missing fields (task, domain, ai_system as model/workflow/agent/dataset), builds one or more records in the long-key schema, and opens a pull request appending them to /Users/dobleefe/dataland/data.json. HuggingFace is the primary supported source today (arxiv and GitHub also work). Triggers on phrases like "add this model", "log this dataset", "register this hf collection", "add this to the registry/datahub", "new record from <hf url>", or any time a HuggingFace URL is dropped in the context of growing the registry. Strongly prefer using this skill — guessing fields by eye produces inconsistent records.
---

# URL → Dataset Record

Build canonical records from a source URL and open a PR appending them to the dataland registry. The registry's source of truth is `/Users/dobleefe/dataland/data.json`.

**Primary supported source: HuggingFace.** Models, datasets, and collections all have first-class extraction paths. Arxiv and GitHub also work but are secondary.

## Workflow

### 1. Identify the source type

The URL host + path tells you which extraction path to use. The deterministic paths (one script call → clean JSON) are always preferred over scraping HTML:

| URL pattern | Extractor | Notes |
| --- | --- | --- |
| `huggingface.co/datasets/<owner>/<name>` | `scripts/fetch_metadata.py hf-dataset <owner>/<name>` | **dataset** — see § 3a |
| `huggingface.co/collections/<owner>/<slug>` | `scripts/fetch_metadata.py hf-collection <url>` | **collection** — expands to N records, see § 3b |
| `huggingface.co/<owner>/<model>` | `scripts/fetch_metadata.py hf <owner>/<model>` | model |
| `arxiv.org/abs/...` or `arxiv.org/pdf/...` | `scripts/fetch_metadata.py arxiv <id>` | paper |
| `github.com/<owner>/<repo>` | `scripts/fetch_metadata.py github <owner>/<repo>` | repo |
| anything else (PWC, Nature, project page) | WebFetch the page and extract | best-effort |

Run the script when applicable — the JSON it returns maps almost directly into the record. For sources without a script path, use WebFetch.

### 2. Read the current registry

Read `/Users/dobleefe/dataland/data.json` once. Two reasons:

1. **Find the next id**: `max(records[].id) + 1`.
2. **Calibrate style**: skim 2–3 existing records — `description` is 2–3 dense factual sentences (~250–450 chars), `params` is the published count without rounding (`"340M"`, `"2.8B"`, not `"3B"`), licenses use canonical short forms (see `references/license-table.md`).

### 3. Build the record(s)

Fill every key listed under `ontology.primary_dimensions` and `ontology.attributes` plus `id` and `description`. Long keys, no abbreviations: `id, task, model, ai_system, architecture, domain, language, source_url, organization, params, year, license, description`.

**Existing taxonomy — reuse when at all reasonable.** Inventing a new value is a permanent vocabulary split; slightly-loose reuse costs nothing. Before picking a new label, check whether one of these fits:

- **task** (existing): Text Classification · Machine Translation · Question Answering · Image Captioning · Code Generation · Object Detection · Speech Recognition · Semantic Segmentation · Text Summarization · Protein Structure · Molecule Generation · Multimodal Reasoning · Audio Generation · Time Series Forecasting · Anomaly Detection
- **domain** (existing): NLP · Multimodal · Code · Computer Vision · Audio · Biology · Chemistry · Time Series · Industrial AI
- **ai_system** (closed enum): **model** · **workflow** · **agent** · **dataset** (see § 4 and `references/ai_system-examples.md`)
- **language** is a **natural language** — never a programming language. The datahub is LATAM-leaning, so most records use BCP-47-ish codes like `"es-AR"`, `"es-PY"`, `"pt-BR"`, `"es-MX"`, `"qu"` (Quechua), `"gn"` (Guarani). Use a short English name (`"Spanish"`, `"English"`) only when no clear regional code applies. Use `"Multilingual"` for multi-language artifacts (NLLB-200, Whisper). Use `"N/A"` for artifacts with no natural language at all — pure vision (SAM, YOLO), audio synthesis, protein structure, time series.

(These lists drift — re-derive from `data.json` if it's grown since the skill was written.)

#### § 3a. Mapping for HuggingFace **datasets**

Datasets are the common case for this skill. Map fields like so:

| Field | Source for HF datasets |
| --- | --- |
| `model` | The dataset's display name — `cardData.pretty_name` if set, otherwise the `name` part of the HF id with hyphens preserved (`"google-argentinian-spanish"`). Yes, the field is called `model`; treat it as the artifact's name regardless of kind. |
| `ai_system` | `"dataset"` — see § 4 |
| `architecture` | A short modality + format descriptor derived from `modalities` and `tags`: `"Audio + Text (parquet)"`, `"Text (parquet)"`, `"Image + Text (webdataset)"`. Keep it short — this column is narrow in the UI. |
| `task` | Map from `task_categories` (HF tag) or infer from `modalities`. `task_categories: ["automatic-speech-recognition"]` → existing `"Speech Recognition"`. Audio + text with no explicit task → `"Speech Recognition"` (the dominant use). Pure text corpora often → `"Text Classification"` if labeled, otherwise propose a new task only as a last resort. |
| `language` | Natural language of the data — see the language rule above. Order of preference: `cardData.language` (canonical YAML), then `languages` (tag-derived), then parse the dataset notes/description, then the dataset name itself. Prefer a regional code when the source supports it (`"es-AR"` over `"es"` for Argentinian Spanish, `"pt-BR"` over `"pt"` for Brazilian Portuguese). |
| `domain` | The high-level field — for speech, almost always `"Audio"`; for text corpora, `"NLP"`. |
| `params` | `"N/A"` — datasets don't have parameters. Do not write the example count here; that belongs in `description`. |
| `organization` | The dataset's primary maintainer. For HF datasets owned by a user account (e.g., `ylacombe/...`), use the underlying source organization if mentioned in the card (`"Google"` for the Argentinian Spanish corpus, which Google originally released). If no clear source org, use the HF account holder's name. |
| `year` | `createdAt` year, unless the README cites an earlier original release year. |
| `license` | `cardData.license` (most authoritative) → `license_tag` → README. Normalize via `references/license-table.md`. If nothing → `"Unknown"`. |
| `source_url` | The user's URL, verbatim. |
| `description` | 2–3 dense sentences: what's in it, how it was constructed, and an interesting quantitative scope (number of examples, hours of audio, size in GB, languages covered). Match the registry's terse factual tone. |

#### § 3b. Handling HuggingFace **collections**

A collection URL expands. The fetcher returns `items[]` (each typed `model | dataset | paper | space`). Behavior:

1. **Show the user the collection summary first.** Title, description, and the list of items by type. Ask whether to import (a) all dataset/model items, (b) a selected subset, or (c) just one. Collections often have 5–50 items — confirm scope before fetching every one.
2. For each item the user confirms, call the matching fetcher (`hf-dataset` or `hf`) and build a record per § 3a or the model rules below.
3. **Skip `paper` and `space` items by default.** Paper items can be added separately via the arxiv URL; space items aren't registry artifacts.
4. Assign sequential ids starting from `max(records[].id) + 1`.
5. The PR includes all the resulting records in one go. Title: `"Add <collection title> (<N> datasets)"`.

The collection note text (`items[].note`) often contains the language and per-item summary — use it to inform `language` and `description` without re-fetching when possible.

#### § 3c. Mapping for HuggingFace **models** (and other model sources)

| Field | Source |
| --- | --- |
| `model` | The model's display name — `"BERT-large"`, `"GPT-4"`, the canonical capitalised form |
| `ai_system` | `"model"` / `"workflow"` / `"agent"` — see § 4 |
| `architecture` | Short noun phrase (`"Transformer (Encoder)"`, `"Vision-Language"`, `"Diffusion + Transformer"`) |
| `task` | The headline use — match HF `pipeline_tag` against existing task labels |
| `language` | Natural language the model handles. Examples: `"en"` (English-only model like BERT-base), `"Multilingual"` (NLLB-200, Whisper-large-v3, GPT-4), `"es-AR"` (a model fine-tuned specifically for Argentinian Spanish). Use `"N/A"` for non-linguistic modalities — vision (YOLOv8, SAM), audio synthesis, protein structure, time series. Never write `"Python"` here. |
| `domain` | `"NLP"`, `"Multimodal"`, etc. |
| `params` | Published count, verbatim, no rounding (`"2.8B"`, not `"3B"`). Use `~` only when the source is itself approximate. For families that ship multiple sizes, use the headline variant and name it in `description`. |
| `organization` | The lead author's / model owner's affiliation. Prefer the most recognisable form (`"Google DeepMind"`, `"Meta AI"`). Single org, not `"X & Y"`. |
| `year` | First-release year as int. |
| `license` | Normalise via `references/license-table.md`. |
| `source_url` | The user's URL, verbatim (strip tracking params; `arxiv.org/pdf/<id>` → `arxiv.org/abs/<id>`). |

If the arxiv API returns no `affiliations` (most papers — the arxiv schema rarely includes them), WebFetch the abstract page or the project's papers-with-code entry to recover them.

### 4. `ai_system` — the closed enum

Four values. Pick the one that fits the headline claim:

- **`"model"`** — a single trained network, single forward pass, well-defined I/O (BERT, YOLOv8, SAM, BLIP-2).
- **`"workflow"`** — a pipeline of multiple components, or a model with non-trivial inference (Whisper-large-v3, AlphaFold 3, AudioLDM 2, PatchCore).
- **`"agent"`** — instruction-tuned, designed to be driven by prompts and chosen actions (GPT-4, CodeLlama-34B, LLaVA-1.6).
- **`"dataset"`** — a data corpus (HF dataset, manually curated benchmark, scraped collection). Has no parameters; `params` is `"N/A"`.

`references/ai_system-examples.md` lists which existing records sit under each — use it for calibration.

### 5. Confirm with the user before opening a PR

PRs are visible and irreversible. Show the proposed record(s) as a JSON block plus the proposed PR title. Wait for approval — the user knows the domain better than the fetched metadata and may rewrite fields.

### 6. Open the PR

Workflow assumes the repo is git-initialized with a remote and `gh` CLI authenticated. If not, see `references/no-git-repo.md` for the fallback (write the JSON to a temp file, tell the user what's missing).

```sh
cd /Users/dobleefe/dataland
git checkout -b add-<slug>          # slug = lowercase artifact name, dashed
# append the record(s) to data.json — see below
git add data.json
git commit -m "Add <artifact name> to dataset registry"
git push -u origin add-<slug>
gh pr create --title "Add <artifact name>" --body "$BODY"
```

Append by inserting the new record(s) at the **end** of the `records` array (before the closing `]`), preserving indent + trailing newline. Do a focused edit — never rewrite the whole file.

PR body template:

```markdown
**Source**: <source_url>
**Artifact**: <model>  ·  **Organization**: <organization>  ·  **Year**: <year>
**Inferred fields**: task=<task>, domain=<domain>, language=<language>, ai_system=<ai_system>
```

Report the PR URL back to the user.

## Schema reference (always defer to data.json)

For the canonical shape, read `/Users/dobleefe/dataland/data.json`. Top-level:

```json
{
  "ontology": {
    "primary_dimensions": ["task", "domain", "language"],
    "attributes": ["model", "architecture", "ai_system", "organization", "params", "year", "license", "source_url"]
  },
  "records": [ /* … */ ]
}
```

Each record carries every key under `primary_dimensions` and `attributes`, plus `id` and `description`.

## Reference material

- `references/license-table.md` — short-form mapping for common licenses.
- `references/ai_system-examples.md` — concrete examples of `"model"` vs `"workflow"` vs `"agent"` vs `"dataset"`.
- `references/no-git-repo.md` — what to do when the repo isn't ready for a PR.
- `references/extraction-tips.md` — extracting fields from messy HTML when no API is available.

## Anti-patterns

- **Don't invent a `model` name.** Use the published one verbatim.
- **Don't bury the source.** `source_url` is the URL the user gave you, minus tracking params.
- **Don't write a press release in `description`.** Match the existing tone: factual, dense, 2–3 sentences.
- **Don't open a PR without confirming.** Always show the JSON first.
- **Don't refactor `data.json` while appending.** Touch only the records array; preserve formatting.
- **`language` is never a programming language.** Always the natural language of the artifact's data (`"es-AR"`, `"pt-BR"`, `"qu"`, `"Multilingual"`) or `"N/A"` for non-linguistic modalities (vision, audio synthesis, protein, time series). The existing 15 seed records have `"Python"` — that's wrong and being phased out.
- **Don't round `params`.** `"2.8B"` is not `"3B"`.
