# Datahub

A living dataset registry — searchable explorer, animated hero, machine-readable JSON signal view. The "database" is a single file: `data.json`.

## Run locally

```sh
python3 -m http.server 8000
```

Open <http://localhost:8000/datahub.html>.

No build step, no `node_modules`, no bundler. The page bootstraps React, Babel, and GSAP from CDN and renders directly.

## Edit data

`data.json` is the source of truth. The shape *is* the ontology — top-level vocabulary lists declare what's allowed; records reference values from those lists:

```jsonc
{
  // primary navigational axes
  "tasks_supported": ["classify", "extract", "transcribe", "summarize", "retrieve_information", "reason", "chat", "voice"],
  "input_types":     ["text", "image", "audio", "video", "code"],
  "domains":         ["general", "medical", "legal", "finance", "scientific"],
  "languages":       ["en", "Multilingual", "N/A"],

  // descriptive attribute vocabularies
  "ai_systems":      ["model", "workflow", "agent", "node"],
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

`task` is a verb (the action). `input_type` is what the action is performed on. `domain` is a knowledge grouping (general / medical / legal / finance / scientific), not a technical bucket.

Derived values come from the top-level lists, not from `records`: the hero stats are `domains.length` / `languages.length` / `contributing_organizations.length`; the org carousel iterates `contributing_organizations`. Add a new record whose `task` is not yet in `tasks_supported` and the validator will tell you to add the verb to the list first.

### Add a record

1. Open `data.json`.
2. If your new record uses a task, input_type, domain, language, architecture, license, or organization that doesn't exist yet, **add it to the corresponding top-level list first**.
3. Append the record to `records` with a new `id`.
4. Run the validator:
   ```sh
   node scripts/validate-data.mjs
   ```
   It exits 0 on success. On any vocabulary miss it prints exactly which record, which field, and which vocabulary is involved.

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
