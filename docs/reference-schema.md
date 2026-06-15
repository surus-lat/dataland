# Reference — `data.json` schema

The entire registry is one JSON file: [`data.json`](../data.json). Its top-level keys
declare the **vocabularies** (the allowed values for every constrained field);
`records` is an array of artifact entries that must reference values from those
vocabularies. The validator enforces this consistency on every commit and
every build.

This page is the authoritative description of the schema. For the design
rationale, see [explanation-design.md](./explanation-design.md). To contribute
a record, see [howto-add-record.md](./howto-add-record.md).

## Top-level keys

```jsonc
{
  "tasks_supported":            [...],   // verbs
  "input_types":                [...],   // mediums
  "domains":                    [...],   // knowledge groupings
  "languages":                  [...],   // LATAM-first language tags
  "ai_systems":                 [...],   // artifact kinds
  "architectures":              [...],   // architecture / format descriptors
  "licenses":                   [...],   // short-form license names
  "contributing_organizations": [...],   // [{ name, logo }]
  "records":                    [...]    // the artifact entries
}
```

Every key is required. `records` may be empty in principle, but the deployed
registry always has entries.

The legacy `ontology` key is rejected. Vocabularies live at the top level,
not nested. The validator will fail with:

```
top-level: legacy "ontology" key must be removed — vocabularies live at the top level now
```

## Vocabulary keys

### `tasks_supported` — verbs

The action the artifact performs. **Always a verb**, never a noun phrase.

Current values:

| Value | When to use |
| --- | --- |
| `classify` | Assign an input to one of a fixed set of labels |
| `extract` | Pull structured spans (entities, relations) from unstructured input |
| `transcribe` | Audio → text |
| `summarize` | Long input → short faithful output |
| `retrieve_information` | Search, RAG, open-domain QA |
| `reason` | Multi-step inference over text or multimodal input |
| `chat` | Conversational instruction-following |
| `voice` | Text → audio (TTS) |

If your artifact's headline action isn't on the list, add the verb in
`tasks_supported` first (alphabetical order), then add the record.

### `input_types` — mediums

The medium the action is performed on.

| Value | Notes |
| --- | --- |
| `text` | Plain or structured text |
| `image` | Single image or sequence of images |
| `audio` | Speech, music, ambient |
| `video` | Frame sequence with audio track |
| `code` | Source code or AST — distinct from `text` for the frontend's signal view |

### `domains` — knowledge groupings

Domains are knowledge groupings, **not** technical buckets. "NLP" and
"Computer Vision" are not domains here; they're combinations of `task` +
`input_type`.

| Value | Use when |
| --- | --- |
| `general` | Open-domain / no specialized field. Default for most records. |
| `medical` | Clinical, biomedical, pharmaceutical content |
| `legal` | Statute, case law, contract text |
| `finance` | Markets, banking, accounting |

### `languages` — LATAM-first

The single most opinionated vocabulary in the registry. See
[explanation-design.md](./explanation-design.md#why-latam-first) for the
reasoning.

| Region | Tags |
| --- | --- |
| Spanish (LATAM) | `es-AR`, `es-BO`, `es-CL`, `es-CO`, `es-CR`, `es-CU`, `es-DO`, `es-EC`, `es-GT`, `es-HN`, `es-MX`, `es-NI`, `es-PA`, `es-PE`, `es-PR`, `es-PY`, `es-SV`, `es-UY`, `es-VE` |
| Portuguese | `pt-BR` |
| Indigenous LATAM | `qu` (Quechua), `gn` (Guarani), `ay` (Aymara) |
| Utility | `en`, `Multilingual`, `N/A` |

Rules:

- **No bare `es` or `pt`.** Every Spanish-speaking LATAM country has its own
  variant. If your dataset's regional code is missing, add it — the
  vocabulary is meant to grow toward more LATAM coverage, not less.
- **European Spanish and European Portuguese are intentionally out of scope.**
  Records limited to those variants don't belong in the registry.
- `Multilingual` is for artifacts that genuinely span many languages
  (Whisper, GPT-4). Don't use it as a fallback when you can't identify the
  language.
- `N/A` is for non-linguistic artifacts (vision-only models, audio-event
  classifiers).
- If you need an indigenous language not on the list, add the ISO 639 code
  and open a PR.

### `ai_systems` — artifact kinds

The closed enum for what *kind* of thing a record describes.

| Value | Use when |
| --- | --- |
| `model` | A single trained network with well-defined I/O (BERT, YOLOv8, SAM) |
| `workflow` | A pipeline or model with non-trivial inference (Whisper-large-v3, AlphaFold) |
| `agent` | Instruction-tuned, driven by prompts and chosen actions (GPT-4, LLaVA) |
| `node` | Reusable building block — confirm with maintainers before using |
| `dataset` | A data corpus (HF dataset, manually curated benchmark, scraped collection) |

For datasets, `params` is `"N/A"` — datasets don't have parameters.

### `architectures` — architecture or format descriptors

Short noun-phrase descriptors. For models, the network family
(`"Transformer (Encoder)"`, `"Vision-Language"`). For datasets, the modality
and packaging (`"Audio + Text (parquet)"`, `"Image + Text (webdataset)"`).
The frontend column is narrow — keep entries under ~30 characters.

### `licenses` — short-form license names

Normalized short forms (`"Apache 2.0"`, `"MIT"`, `"CC-BY-SA 4.0"`,
`"Proprietary"`). For the canonical mapping from raw license tags to short
forms used here, see
[`.claude/skills/url-to-dataset-record/references/license-table.md`](../.claude/skills/url-to-dataset-record/references/license-table.md).

### `contributing_organizations`

An array of `{ name, logo }` objects, not bare strings. `logo` may be `null`.

```jsonc
"contributing_organizations": [
  { "name": "Google", "logo": null },
  { "name": "Hugging Face", "logo": "/uploads/logos/hf.svg" }
]
```

Records reference the `name` field. The `logo` field is consumed by the
frontend's contributor cluster.

## Record shape

Each entry in `records` has this exact set of fields. All are required.

```jsonc
{
  "id":            6,                        // unique int, max+1 of existing ids
  "task":          "transcribe",             // ∈ tasks_supported
  "input_type":    "audio",                  // ∈ input_types
  "domain":        "general",                // ∈ domains
  "language":      "es-AR",                  // ∈ languages
  "ai_system":     "dataset",                // ∈ ai_systems
  "architecture":  "Audio + Text (parquet)", // ∈ architectures
  "organization":  "Google",                 // ∈ contributing_organizations[].name
  "license":       "CC-BY-SA 4.0",           // ∈ licenses
  "model":         "google-argentinian-spanish", // artifact display name
  "params":        "N/A",                    // string (e.g. "340M", "2.8B", "N/A")
  "year":          2020,                     // int — first release year
  "source_url":    "https://huggingface.co/datasets/ylacombe/google-argentinian-spanish",
  "description":   "Crowd-sourced read-speech corpus of Argentinian Spanish from Google — short utterances paired with transcripts, originally released to enable LATAM-targeted TTS and ASR research. The HF mirror packages the original Google distribution into parquet shards for streaming."
}
```

### Field semantics

| Field | Type | Notes |
| --- | --- | --- |
| `id` | int | Unique. New records use `max(records[].id) + 1`. Duplicate ids fail validation. |
| `task` | string | Verb from `tasks_supported`. The action. |
| `input_type` | string | Medium from `input_types`. The thing the action operates on. |
| `domain` | string | Knowledge grouping from `domains`. Default `"general"`. |
| `language` | string | LATAM-first tag from `languages`. Country code for region-specific data, `Multilingual` for true multi-language, `N/A` for non-linguistic. |
| `ai_system` | string | Artifact kind from `ai_systems`. |
| `architecture` | string | From `architectures`. Model architecture for models; modality + format for datasets. |
| `organization` | string | Must match a `name` in `contributing_organizations`. Use the **upstream source**, not the republisher (e.g. `Google`, not the HF account holder). |
| `license` | string | Short-form from `licenses`. |
| `model` | string | The artifact's display name. Yes, the field is called `model` even for datasets and agents — treat it as the artifact name regardless of kind. |
| `params` | string | Parameter count as a published string (`"340M"`, `"1.55B"`, `"Unknown"`). For datasets, `"N/A"`. Don't round (`"2.8B"` ≠ `"3B"`). |
| `year` | int | First-release year. For HF mirrors of older corpora, use the upstream year, not the upload year. |
| `source_url` | string | The artifact's canonical URL, with tracking params stripped. |
| `description` | string | 2–3 dense factual sentences, ~250–450 characters. Match the registry's terse tone — no marketing language. |

## Derived values

The frontend computes its hero stats from the **vocabularies**, not from
`records`:

- "Domains" count → `domains.length`
- "Languages" count → `languages.length`
- "Organizations" count → `contributing_organizations.length`
- "AI Systems" count → `ai_systems.length`

This means: adding a vocabulary entry without any record using it will
increase the displayed stats. The validator warns on unused entries but
does not block.

## Validation rules

`scripts/validate-data.mjs` is the single source of truth for validation
behavior. It runs:

- Locally before each commit (if [`scripts/install-hooks.sh`](../scripts/install-hooks.sh) was run)
- As the first step of [`build.sh`](../build.sh), which Cloudflare Pages invokes

### Errors (exit 1)

| Rule | Message shape |
| --- | --- |
| `tasks_supported`, `input_types`, `domains`, `languages`, `ai_systems`, `architectures`, `licenses` must each be arrays | `top-level: "<key>" must be an array` |
| `contributing_organizations` must be an array of `{ name, logo }` | `top-level: "contributing_organizations" must be an array of {name, logo}` |
| `records` must be an array | `top-level: "records" must be an array` |
| Legacy `ontology` key must not exist | `top-level: legacy "ontology" key must be removed — vocabularies live at the top level now` |
| Each org entry must have a string `name` | `contributing_organizations[i]: missing string "name"` |
| Each org entry must include a `logo` key (`null` is fine) | `contributing_organizations[i] ("<name>"): missing "logo" key (use null if none)` |
| Records must include every required field | `record #<id> ("<model>"): missing field "<field>"` |
| Record ids must be unique | `record #<id> ("<model>"): duplicate id` |
| Every constrained field must reference its vocabulary | `record #<id> ("<model>"): <field> "<value>" not in <vocab> — add it to the list or change the record` |
| `organization` must match a name in `contributing_organizations` | `record #<id> ("<model>"): organization "<name>" not in contributing_organizations — add it to the list or change the record` |

### Warnings (exit 0)

| Rule | Message shape |
| --- | --- |
| Vocabulary entry exists but no record references it | `<vocab>: "<value>" is in the vocabulary but no record uses it` |
| Organization listed but no record references it | `contributing_organizations: "<name>" is listed but no record references it` |

Warnings don't block commits. They surface the gap between the declared
vocabulary and the live data so it gets cleaned up over time.

### Success output

```
data.json: ok (5 records, 8 tasks, 3 organizations)
```

## Required record fields (machine-readable)

```js
const REQUIRED_FIELDS = [
  'id', 'task', 'input_type', 'domain', 'language',
  'ai_system', 'architecture', 'organization', 'license',
  'model', 'params', 'year', 'source_url', 'description',
];
```

## Related

- [How to add a record](./howto-add-record.md) — task-oriented guide for contributing
- [Tutorial: your first contribution](./tutorial-first-contribution.md) — walkthrough
- [Why the schema looks this way](./explanation-design.md) — design rationale
- [`scripts/validate-data.mjs`](../scripts/validate-data.mjs) — the validator source
- [`data.json`](../data.json) — the live registry
