# Explanation — why the schema and vocabularies look this way

This document explains the design choices behind `data.json`. If you want
to know **what** the schema is, see [reference-schema.md](./reference-schema.md).
If you want to know **how** to add a record, see [howto-add-record.md](./howto-add-record.md).
This page is about **why**.

Two design decisions shape almost everything else in the registry:

1. The ontology lives inside the data file, not in a separate schema.
2. The languages vocabulary is LATAM-first, by intent, not by accident.

## Why LATAM-first

### The problem

Most public AI registries treat Latin America as an afterthought.

- Spanish is collapsed into one bucket — `es` — flattening 20 country
  variants whose vocabulary, phonetics, and cultural references diverge
  enough that a model trained on European Spanish performs poorly on
  Argentinian voice data, and vice versa.
- Portuguese is collapsed into another single bucket, despite Brazilian
  Portuguese being a separate working register from European Portuguese.
- Indigenous LATAM languages — Quechua, Guarani, Aymara — are usually
  absent entirely, even though tens of millions of people speak them and
  several have a growing body of training and evaluation corpora.
- Filtering "where is the work happening?" is hard. A researcher in Lima
  looking for fine-tuned LLMs that handle Peruvian Spanish has no way to
  surface them above a sea of English-only models.

The flat result: LATAM AI work is harder to find than it should be, and
the absence reinforces the absence. New contributors don't see prior
LATAM work, so they don't know to tag their own work as LATAM-relevant.

### The approach

Make the vocabulary itself biased toward LATAM visibility.

- Every Spanish-speaking LATAM country gets its own ISO 639 + ISO 3166
  variant: `es-AR`, `es-BO`, `es-CL`, …, `es-VE`. There is no plain `es`.
- Brazilian Portuguese is `pt-BR`. There is no plain `pt`.
- The three most-spoken indigenous LATAM languages — Quechua (`qu`),
  Guarani (`gn`), Aymara (`ay`) — are first-class vocabulary entries,
  not exotic add-ons.
- European Spanish and European Portuguese are intentionally absent.
- Utility values (`en`, `Multilingual`, `N/A`) handle the rest: English
  for global context, Multilingual for genuinely cross-language artifacts,
  N/A for non-linguistic ones.

A record tagged `es-AR` is unambiguous. A record tagged `Multilingual`
explicitly opts out of regional specificity, which itself is information.

### The trade-offs

- **A LATAM dataset accidentally annotated with bare `es` will fail
  validation.** The contributor is forced to pick a country code. This
  friction is intentional — it surfaces a question the source data already
  answers but most registries discard.
- **A European-Spanish-only model has no home here.** That's a deliberate
  scope decision, not an oversight. The registry is not trying to be a
  universal AI catalog; it's trying to be the best catalog for LATAM-
  relevant work.
- **The vocabulary is large.** 19 Spanish variants + Brazilian Portuguese
  + 3 indigenous languages + 3 utility values = 26 entries. The frontend
  hero stats are derived from this count, so the registry can claim
  meaningful language coverage from day one. The cost is that some
  variants will be sparsely populated until contributors fill them in,
  which the validator's "vocabulary entry has no records" warning makes
  visible.

### What we considered and rejected

- **ISO 639-1 only (`es`, `pt`).** Conventional but flattens exactly the
  distinctions the registry exists to preserve. Rejected.
- **`es` plus optional regional tags as a separate field.** Splits one
  question into two and lets contributors silently skip the region.
  Rejected — defaults to "didn't specify" instead of "doesn't exist".
- **All ISO 3166 country codes for Spanish, including European.** Adds
  noise without serving the mission. If European Spanish coverage ever
  becomes relevant, it's one PR away.

## Why the ontology lives inside `data.json`

### The problem

A registry like this naturally splits into two layers:

- The **ontology** — the closed sets of allowed values for every constrained
  field (which tasks, which languages, which licenses).
- The **records** — the artifact entries that reference those values.

The conventional pattern is to put the ontology in a separate schema file
(`ontology.json`, `schema.yaml`) and the records in the data file. That
pattern has real costs in a project this small:

- Two files to keep in sync. Adding a new language means editing both —
  miss the schema and the record validates against stale terms; miss the
  data and the new term has nothing to point to.
- The schema file becomes a wall in the contributor's path. To add a
  record they have to know about it, find it, understand it, then come
  back to the data file. For a 5-record demo registry, that's a lot of
  ceremony.
- Frontends end up loading two files and joining them in memory. Easy
  enough, but it's plumbing nobody asked for.
- The legacy version of this project had a nested `ontology` key inside
  `data.json` — same problem in one file. The validator explicitly
  rejects it.

### The approach

Put the vocabularies at the **top level of `data.json`**, alongside
`records`. The file's shape **is** the ontology:

```jsonc
{
  "tasks_supported": [...],
  "input_type":      [...],
  "output_type":     [...],
  "languages":       [...],
  // ... more vocabularies ...
  "records":         [...]
}
```

The validator (`scripts/validate-data.mjs`) reads one file, performs both
shape checks and cross-reference checks, and reports errors with both the
record id and the offending vocabulary key. Adding a new record uses the
same flow whether you need a new language or not: open `data.json`, edit
in place, run the validator.

### The trade-offs

- **The file is bigger than a pure records list.** Trivial — the vocabularies
  are kilobytes; the records will be the bulk of any meaningful registry.
- **Top-level keys collide with record-list conventions.** Tools that expect
  `data.json` to be `[record, record, ...]` need an extra step to extract
  `data.records`. The frontend handles this in one line.
- **Schema versioning is harder.** There's no separate schema file to bump.
  If the schema ever changes in a breaking way, the migration has to happen
  inside the same file. For a registry at this scale, easier to do in one
  place than across two.

### What we considered and rejected

- **Separate `schema.json`.** The doubled-edit cost outweighed the
  organizational tidiness for a project this small.
- **Nested `ontology` key.** Indistinguishable from the top-level layout
  for editing purposes, but worse for the validator (one more layer to
  traverse) and worse for the frontend (one more nesting to unwrap). The
  current validator explicitly errors on `ontology` to surface old data
  that hasn't migrated.
- **Inferring the vocabulary from the records.** Letting the records
  define the vocabulary inverts the constraint: nothing would prevent a
  typo (`transcrbe`) from being silently added as a new "task". The whole
  point of the validator is to catch exactly that. Rejected.

## Why the validator runs at commit time and at build time

Running validation only at build time means broken data lands on the
default branch before CI catches it. Running validation only at commit
time means contributors who skip the local hook ship broken data.

The validator runs in both places:

- **`hooks/pre-commit`** — runs on every local commit, after
  `scripts/install-hooks.sh` configures `core.hooksPath`. Catches errors
  at the earliest possible point.
- **`build.sh`** — the first step before any file is copied to `dist/`.
  Catches errors in CI / on Cloudflare Pages, even when the local hook
  was skipped.

The same script (`scripts/validate-data.mjs`) runs in both contexts, so
the behavior is identical. There is no separate "stricter CI mode" or
"loose dev mode" — broken data fails the same way everywhere.

## Why `task` is a verb and `input_type` is the medium

The conventional pattern in AI catalogs is to combine these into a single
field — `"task": "Speech Recognition"`, `"task": "Image Classification"`.
That conflation makes filtering brittle.

If you want to know "what can transcribe audio?", you can't ask a single-
field schema cleanly: speech recognition models are tagged
`"Speech Recognition"`, audio captioning models are tagged
`"Audio Captioning"`, and the relationship to the medium is buried in the
phrase. Splitting `task` (verb) from `input_type` (medium) gives the
frontend two orthogonal filter axes:

- `task = "transcribe"` → returns every transcription-capable artifact
  regardless of medium-naming convention.
- `input_type = "audio"` → returns every audio-consuming artifact
  regardless of what verb it performs on the audio.

The Pareto trade is that a few verbs occasionally feel awkward
(`retrieve_information` is a verb phrase, not a single verb), but the
filter axes stay clean. Worth it.

## Why `organization` is the upstream source, not the republisher

The HuggingFace pattern is for one account to mirror another organization's
corpus. `ylacombe/google-argentinian-spanish` is Google's original corpus,
republished by HF user `ylacombe`. If the registry records `ylacombe` as the
organization, two records of Google corpora republished by different HF
users would appear as two organizations — wrong, and it makes the
"contributors" view useless.

Rule: `organization` is the **upstream source** named in the README, not
the HF account holder. For corpora whose only identifiable owner is the
HF user (rare for major datasets), use the HF user — but check the README
first.

## Related

- [Reference: the schema](./reference-schema.md) — what the rules are
- [How to add a record](./howto-add-record.md) — how to apply them
- [Tutorial: your first contribution](./tutorial-first-contribution.md) — walkthrough
