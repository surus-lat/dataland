# Reference — `data.json` schema

The entire registry is one JSON file: [`data.json`](../data.json). Its top-level keys
declare the **vocabularies** (the allowed values for every constrained field);
`records` is an array of **dataset entries** that must reference values from those
vocabularies. The validator enforces this consistency on every commit and
every build.

This page is the authoritative description of the schema. For the design
rationale, see [explanation-design.md](./explanation-design.md). To contribute
a record, see [howto-add-record.md](./howto-add-record.md).

> **Datasets only.** Every record in this registry describes a dataset — a
> corpus used to train or evaluate AI systems. There are no `ai_system`,
> `architecture`, or `params` fields. If a URL describes a model, an agent,
> or a benchmark leaderboard, it does not belong here.

## Top-level keys

```jsonc
{
  "tasks_supported":            [...],   // verbs the datasets train/evaluate
  "input_type":                 [...],   // mediums consumed
  "output_type":                [...],   // mediums produced
  "domains":                    [...],   // knowledge groupings
  "languages":                  [...],   // LATAM-first language tags
  "licenses":                   [...],   // short-form license names
  "contributing_organizations": [...],   // [{ name, logo }]
  "records":                    [...]    // the dataset entries
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

The action the dataset trains or evaluates. **Always a verb**, never a noun phrase.

| Value | When to use |
| --- | --- |
| `transcribe` | Audio → text |

The current registry is transcription-focused. Adding a dataset whose
headline task isn't on the list? Add the verb in `tasks_supported` first
(alphabetical order), then add the record.

### `input_type` — mediums consumed

The medium the trained system reads.

| Value | Notes |
| --- | --- |
| `audio` | Speech, music, ambient |

(Extend with `text`, `image`, `video`, `code` as records require.)

### `output_type` — mediums produced

The medium the trained system emits.

| Value | Notes |
| --- | --- |
| `text` | ASR transcripts, translations |

(Extend with `audio` for TTS, etc., as records require.)

### `domains` — knowledge groupings

Domains are knowledge groupings, **not** technical buckets. "NLP" and
"Computer Vision" are not domains here.

| Value | Use when |
| --- | --- |
| `general` | Open-domain / no specialized field. Default for most records. |

(Extend with `medical`, `legal`, `finance` as records require.)

### `languages` — LATAM-first

The single most opinionated vocabulary in the registry. See
[explanation-design.md](./explanation-design.md#why-latam-first) for the
reasoning.

| Region | Tags |
| --- | --- |
| Spanish (LATAM) | `es-AR`, `es-BO`, `es-CL`, `es-CO`, `es-CR`, `es-CU`, `es-DO`, `es-EC`, `es-GT`, `es-HN`, `es-MX`, `es-NI`, `es-PA`, `es-PE`, `es-PR`, `es-PY`, `es-SV`, `es-UY`, `es-VE` |
| Spanish (coarse) | `es` — fallback when the source page mentions Spanish but doesn't resolve sub-variants |
| Portuguese | `pt-BR`, `pt` (coarse fallback) |
| Indigenous LATAM | `qu` (Quechua), `gn` (Guarani), `ay` (Aymara) |
| Utility | `en`, `Multilingual`, `N/A` |

Rules:

- **Records use an array of language tags**, not a single string. Even
  single-language datasets use a one-element array (`["es-AR"]`).
- **List every variant the source page names.** PRESEEA names 11 LATAM
  countries → list all 11 country codes. The point of the array is so a
  contributor can scan and tell at a glance whether their variant of
  interest is covered.
- **`es` / `pt` are coarse fallbacks**, not the default. Use them only when
  the source mentions Spanish/Portuguese but doesn't resolve sub-variants.
  A record reading `["es"]` means "Spanish, breakdown not stated";
  `["es-AR", "es-MX"]` means "specifically Argentinian and Mexican Spanish".
- **`Multilingual` is for multiple *different* languages** (Spanish +
  Portuguese + Quechua), not multiple Spanish variants. A pan-Hispanic
  corpus is `["es"]` or a list of country codes.
- **European Spanish and European Portuguese are intentionally out of scope.**
  Drop Castilian / peninsular / Canary from the array. If all you have is
  peninsular, the dataset isn't a LATAM fit.
- **`N/A` is for non-linguistic artifacts** (audio-event classifiers, etc.).
- If you need an indigenous language not on the list, add the ISO 639 code
  and open a PR.

### `licenses` — short-form license names

Normalized short forms (`"CC0"`, `"CC-BY-SA 4.0"`, `"GPL-3.0"`,
`"CC-BY-NC-ND 4.0"`, etc.). For the canonical mapping from raw license tags
to short forms used here, see
[`.claude/skills/url-to-dataset-record/references/license-table.md`](../.claude/skills/url-to-dataset-record/references/license-table.md).

### `contributing_organizations`

An array of `{ name, logo }` objects, not bare strings. `logo` may be `null`.

```jsonc
"contributing_organizations": [
  { "name": "Mozilla Foundation", "logo": null },
  { "name": "Google", "logo": "/uploads/logos/google.svg" }
]
```

Records reference the `name` field. The `logo` field is consumed by the
frontend's contributor cluster.

## Record shape

Each entry in `records` has this exact set of fields. All are required.

```jsonc
{
  "id":            3,                                  // unique int, max+1 of existing ids
  "task":          "transcribe",                       // ∈ tasks_supported
  "input_type":    "audio",                            // ∈ input_type
  "output_type":   "text",                             // ∈ output_type
  "domain":        "general",                          // ∈ domains
  "languages":     ["es-AR"],                          // array — every entry ∈ languages
  "organization":  "Google",                           // ∈ contributing_organizations[].name
  "license":       "CC-BY-SA 4.0",                     // ∈ licenses
  "model":         "google-argentinian-spanish",       // dataset display name
  "year":          2020,                               // int — first release year
  "source_url":    "https://huggingface.co/datasets/ylacombe/google-argentinian-spanish",
  "description":   "Crowd-sourced read-speech corpus of Argentinian Spanish from Google — short utterances paired with transcripts, originally released to enable LATAM-targeted TTS and ASR research. Splits cover 3,921 female and 1,818 male recordings, packaged by the HF mirror into parquet shards for streaming."
}
```

### Field semantics

| Field | Type | Notes |
| --- | --- | --- |
| `id` | int | Unique. New records use `max(records[].id) + 1`. Duplicate ids fail validation. |
| `task` | string | Verb from `tasks_supported`. The action the dataset trains/evaluates. |
| `input_type` | string | Medium from `input_type`. What the trained system consumes. |
| `output_type` | string | Medium from `output_type`. What the trained system produces. |
| `domain` | string | Knowledge grouping from `domains`. Default `"general"`. |
| `languages` | string[] | Non-empty array of tags from `languages`. List every variant the source names; use coarse `es`/`pt` only when sub-variants aren't resolved. |
| `organization` | string | Must match a `name` in `contributing_organizations`. Use the **upstream source**, not the republisher (e.g. `Google`, not the HF account holder). |
| `license` | string | Short-form from `licenses`. |
| `model` | string | The dataset's display name. Yes, the field is called `model` — legacy. Treat it as the dataset name. |
| `year` | int | First-release year. For HF mirrors of older corpora, use the upstream year, not the upload year. |
| `source_url` | string | The dataset's canonical URL, with tracking params stripped. |
| `description` | string | 2–3 dense factual sentences, ~250–450 characters. Include format details (parquet, MP3, WAV, TSV). Match the registry's terse tone — no marketing language. |

## Derived values

The frontend computes its hero stats from the **vocabularies**, not from
`records`:

- "Domains" count → `domains.length`
- "Languages" count → `languages.length`
- "Organizations" count → `contributing_organizations.length`

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
| `tasks_supported`, `input_type`, `output_type`, `domains`, `languages`, `licenses` must each be arrays | `top-level: "<key>" must be an array` |
| `contributing_organizations` must be an array of `{ name, logo }` | `top-level: "contributing_organizations" must be an array of {name, logo}` |
| `records` must be an array | `top-level: "records" must be an array` |
| Legacy `ontology` key must not exist | `top-level: legacy "ontology" key must be removed — vocabularies live at the top level now` |
| Each org entry must have a string `name` | `contributing_organizations[i]: missing string "name"` |
| Each org entry must include a `logo` key (`null` is fine) | `contributing_organizations[i] ("<name>"): missing "logo" key (use null if none)` |
| Records must include every required field | `record #<id> ("<model>"): missing field "<field>"` |
| Record ids must be unique | `record #<id> ("<model>"): duplicate id` |
| `languages` must be a non-empty array | `record #<id> ("<model>"): languages must be an array of values from languages` / `… must not be empty` |
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
data.json: ok (6 records, 1 tasks, 5 organizations)
```

## Required record fields (machine-readable)

```js
const REQUIRED_FIELDS = [
  'id', 'task', 'input_type', 'output_type', 'domain', 'languages',
  'organization', 'license', 'model', 'year', 'source_url', 'description',
];
```

## Related

- [How to add a record](./howto-add-record.md) — task-oriented guide for contributing
- [Tutorial: your first contribution](./tutorial-first-contribution.md) — walkthrough
- [Why the schema looks this way](./explanation-design.md) — design rationale
- [`scripts/validate-data.mjs`](../scripts/validate-data.mjs) — the validator source
- [`data.json`](../data.json) — the live registry
