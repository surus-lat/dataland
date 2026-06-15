# Datahub

**A living, open registry of AI Data — built by and for Latin America.**

Open source. Open data. Anyone can add a record.

## What lives here

The "database" is a single file: [`data.json`](./data.json). It catalogs five kinds of AI systems:

- **`model`** — pretrained models (LLMs, encoders, speech models, vision)
- **`dataset`** — training and evaluation corpora, especially LATAM-language data
- **`agent`** — agentic systems with tools and memory
- **`workflow`** — multi-step orchestrations
- **`node`** — reusable building blocks

Records are indexed by the verb they perform (`classify`, `transcribe`, `chat`, …), what they operate on (`text`, `audio`, `image`, …), the domain (`medical`, `legal`, `finance`, …), and the language. The frontend at [`datahub.html`](./datahub.html) is a searchable explorer with an animated hero and a machine-readable signal view.

## Why LATAM-first

The `languages` vocabulary is the most visible signal of this stance:

- One Spanish variant per LATAM country (`es-AR`, `es-BO`, `es-CL`, `es-CO`, `es-MX`, `es-PE`, `es-UY`, `es-VE`, …)
- Brazilian Portuguese (`pt-BR`)
- The major indigenous languages of the region (`qu` Quechua, `gn` Guarani, `ay` Aymara)
- Utility values: `en`, `Multilingual`, `N/A`

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
  "tasks_supported": ["classify", "extract", "transcribe", "summarize", "retrieve_information", "reason", "chat", "voice"],
  "input_types":     ["text", "image", "audio", "video", "code"],
  "domains":         ["general", "medical", "legal", "finance", "scientific"],
  "languages":       ["es-AR", "es-BO", "es-CL", "...", "pt-BR", "qu", "gn", "ay", "en", "Multilingual", "N/A"],

  // descriptive attribute vocabularies
  "ai_systems":      ["model", "workflow", "agent", "node", "dataset"],
  "architectures":   ["Transformer (Encoder)", "Transformer (Decoder)", "..."],
  "licenses":        ["Apache 2.0", "MIT", "..."],
  "contributing_organizations": [
    { "name": "Google", "logo": null }
  ],

  "records": [
    {
      "id": 1,
      "task": "classify",            // must ∈ tasks_supported
      "input_type": "text",          // must ∈ input_types
      "domain": "general",           // must ∈ domains
      "language": "en",              // must ∈ languages
      "ai_system": "model",          // must ∈ ai_systems
      "architecture": "Transformer (Encoder)",
      "organization": "Google",      // must match a name in contributing_organizations
      "license": "Apache 2.0",
      "model": "BERT-large",
      "params": "340M",
      "year": 2019,
      "source_url": "https://arxiv.org/abs/1810.04805",
      "description": "Pre-trained deep bidirectional transformers…"
    }
  ]
}
```

`task` is a verb (the action). `input_type` is what the action is performed on. `domain` is a knowledge grouping, not a technical bucket. Derived values come from the top-level lists, not from `records`: the hero stats are `domains.length` / `languages.length` / `contributing_organizations.length`. Add a record whose `task` is not yet in `tasks_supported` and the validator will tell you to add the verb to the list first.

## Contribute a record

We especially welcome:

- **LATAM datasets** — corpora in any es-XX variant, pt-BR, or indigenous languages
- **Models trained or fine-tuned on LATAM data**
- **Agents and workflows built by LATAM teams or for LATAM use cases**
- **Domain-specific work** in health, law, finance, and science from the region

Steps:

1. Open [`data.json`](./data.json).
2. If your new record uses a task, input_type, domain, language, architecture, license, or organization that doesn't exist yet, **add it to the corresponding top-level list first**.
3. Append the record to `records` with a new `id`.
4. Run the validator:
   ```sh
   node scripts/validate-data.mjs
   ```
   It exits 0 on success. On any vocabulary miss it prints exactly which record, which field, and which vocabulary is involved.
5. Open a PR following [`CONTRIBUTING.md`](./CONTRIBUTING.md).

If you're adding a HuggingFace dataset and use Claude Code, the `url-to-dataset-record` skill will fetch the dataset card and draft the record for you.

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
