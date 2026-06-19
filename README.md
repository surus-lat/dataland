# Datahub

**A living, open registry of AI Data — built by and for Latin America.**

Open source. Open data. Anyone can add a record.

## What lives here

The "database" is a single file: [`data.json`](./data.json). It catalogs **datasets** — corpora used to train or evaluate AI systems, especially LATAM-language data.

Records are indexed by the task they support (`transcribe`, …), the medium fed in (`audio`, `text`, `image`, …), the medium produced (`text`, `audio`, …), the domain (`general`, `medical`, `legal`, `finance`, …), and the language. The frontend at [`datahub.html`](./datahub.html) is a searchable explorer with an animated hero and a machine-readable signal view.

## Why LATAM-first

The `languages` vocabulary is the most visible signal of this stance:

- One Spanish variant per LATAM country (`es-AR`, `es-BO`, `es-CL`, `es-CO`, `es-MX`, `es-PE`, `es-UY`, `es-VE`, …)
- Brazilian Portuguese (`pt-BR`)
- Coarse fallbacks (`es`, `pt`) for datasets where the source page doesn't resolve sub-variants — a record reading `["es"]` means "Spanish, breakdown not stated"; `["es-AR", "es-MX"]` means "specifically Argentinian and Mexican Spanish"
- The major indigenous languages of the region (`qu` Quechua, `gn` Guarani, `ay` Aymara)
- Utility values: `en`, `Multilingual` (multiple *different* languages, not multiple Spanish variants), `N/A`

European Spanish and European Portuguese are intentionally **out of scope**. If a system was built for or evaluated on a LATAM variant, it belongs here. If you want to add an indigenous language we missed, open a PR — the vocabulary is meant to grow.

## Run locally

```sh
python3 -m http.server 8000
```

Open <http://localhost:8000/datahub.html>.

No build step, no `node_modules`, no bundler. The page bootstraps React, Babel, and GSAP from CDN and renders directly.

## How the data is shaped

`data.json` is the source of truth. The shape *is* the ontology — top-level vocabulary lists declare what's allowed; records reference values from those lists:

```jsonc
{
  // primary navigational axes
  "tasks_supported": ["transcribe", "..."],
  "input_type":      ["audio", "text", "..."],   // medium fed in
  "output_type":     ["text", "audio", "..."],   // medium produced
  "domains":         ["general", "medical", "legal", "finance"],
  "languages":       ["es-AR", "es-BO", "es-CL", "...", "pt-BR", "qu", "gn", "ay", "en", "Multilingual", "N/A"],

  // descriptive attribute vocabularies
  "licenses":        ["CC0", "CC-BY-SA 4.0", "GPL-3.0", "..."],
  "contributing_organizations": [
    { "name": "Mozilla Foundation", "logo": null }
  ],

  "records": [
    {
      "id": 1,
      "task": "transcribe",            // must ∈ tasks_supported
      "input_type": "audio",           // must ∈ input_type
      "output_type": "text",           // must ∈ output_type
      "domain": "general",             // must ∈ domains
      "languages": ["es-AR"],          // array — every entry must ∈ languages
      "organization": "Universidad Nacional de La Plata",  // must match contributing_organizations
      "license": "CC-BY-NC-SA 4.0",
      "model": "CordeBA",              // dataset's display name
      "year": 2024,
      "source_url": "https://huggingface.co/datasets/marianbasti/cordeba",
      "description": "Spontaneous-speech corpus of informal conversations…"
    }
  ]
}
```

Every record is a dataset — that's the only kind. `task` is the verb the dataset trains or evaluates (the action). `input_type` is what the trained system consumes; `output_type` is what it produces. `domain` is a knowledge grouping, not a technical bucket. Derived values come from the top-level lists, not from `records`: the hero stats are `domains.length` / `languages.length` / `contributing_organizations.length`. Add a record whose `task` is not yet in `tasks_supported` and the validator will tell you to add the verb to the list first.

## Contribute a record

We especially welcome:

- **LATAM datasets** — corpora in any es-XX variant, pt-BR, or indigenous languages
- **Domain-specific corpora** in health, law, finance, and related fields from the region

Steps:

1. Open [`data.json`](./data.json).
2. If your new record uses a task, input_type, output_type, domain, language, license, or organization that doesn't exist yet, **add it to the corresponding top-level list first**.
3. Append the record to `records` with a new `id`.
4. Run the validator:
   ```sh
   node scripts/validate-data.mjs
   ```
   It exits 0 on success. On any vocabulary miss it prints exactly which record, which field, and which vocabulary is involved.
5. Open a PR following [`CONTRIBUTING.md`](./CONTRIBUTING.md).

If you're adding a HuggingFace dataset or a Mozilla Data Collective entry and use Claude Code, the `url-to-dataset-record` skill will fetch the dataset card and draft the record for you.

### One-time hook setup

```sh
bash scripts/install-hooks.sh
```

This points `git` at the versioned `hooks/` directory. From then on, every commit runs the validator and rejects inconsistent data. The validator also runs as the first step of `build.sh`, so Cloudflare Pages builds fail loudly on broken data.

## Deploy

The project deploys to Cloudflare Pages via the workflow in `.github/workflows/`. `build.sh` validates `data.json` and assembles `dist/`; any other static host (Netlify, GitHub Pages, S3 + CloudFront) works the same way — just serve the directory.

## File map

| File | Role |
| --- | --- |
| `datahub.html` | Main shell — React app, scroll choreography, dataset explorer, signal view |
| `hero.jsx` | Hero overlay — title, lat/long, stat cluster, typewriter terminal |
| `Living Layers.html` | Animated background — loaded as a full-bleed iframe |
| `tweaks-panel.jsx` | Design-token utilities used by the panel |
| `uploads/hero-bg.png` | Background photograph (2048×1153) |
| `data.json` | The "db" — top-level vocabularies + records |
| `scripts/validate-data.mjs` | Consistency validator (run on commit + build) |
| `scripts/install-hooks.sh` | One-time `git config core.hooksPath hooks` |
| `hooks/pre-commit` | Runs the validator before each commit |
| `build.sh` | Validates `data.json`, populates `dist/` for Cloudflare Pages |

## Documentation

Deep docs live in [`docs/`](./docs/), organized by reader mode (Diataxis):

| Doc | When to read |
| --- | --- |
| [Tutorial — your first contribution](./docs/tutorial-first-contribution.md) | You're new and want a hands-on walkthrough from clone to PR |
| [How to add a record](./docs/howto-add-record.md) | You know the basics and want a task-focused reference for contributing |
| [Schema reference](./docs/reference-schema.md) | You want the exact rules: every field, every vocabulary, every validator check |
| [Why the schema looks this way](./docs/explanation-design.md) | You want the design rationale — LATAM-first, ontology-in-data, validator at commit + build |

## License & participation

Open project. Open registry. PRs welcome from anywhere, with a strong preference for work that increases LATAM visibility. If you maintain a model, dataset, or system that fits and isn't here yet — add it.
