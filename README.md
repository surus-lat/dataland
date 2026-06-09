# Datahub

A living dataset registry — searchable explorer, animated hero, machine-readable JSON signal view. The "database" is a single file: `data.json`.

## Run locally

```sh
python3 -m http.server 8000
```

Open <http://localhost:8000/datahub.html>.

No build step, no `node_modules`, no bundler. The page bootstraps React, Babel, and GSAP from CDN and renders directly.

## Edit data

`data.json` is the source of truth. The shape:

```jsonc
{
  "ontology": {
    "primary_dimensions": ["task", "domain", "language"],
    "attributes": ["model", "architecture", "ai_system", "organization", "params", "year", "license", "source_url"]
  },
  "records": [
    {
      "id": 1,
      "task": "Text Classification",
      "model": "BERT-large",
      "ai_system": "model",
      "architecture": "Transformer (Encoder)",
      "domain": "NLP",
      "language": "Python",
      "source_url": "https://arxiv.org/abs/1810.04805",
      "organization": "Google",
      "params": "340M",
      "year": 2019,
      "license": "Apache 2.0",
      "description": "Pre-trained deep bidirectional transformers…"
    }
    // …
  ]
}
```

The hero stat counters (datasets, domains, languages, contributors), the explorer table, the search filter, the org carousel, and the AI signal view all read from this file. Contributors is computed as the count of unique `organization` values.

Edit the file, refresh the page, the UI updates. To ship changes: commit and redeploy.

## Deploy

Any static host. Vercel:

```sh
vercel deploy --prod
```

`vercel.json` routes `/` to `datahub.html` and sets a 60-second cache on `data.json` so the two parallel fetches from the hero and the explorer share one network trip.

Netlify, Cloudflare Pages, GitHub Pages, S3 + CloudFront — all equivalent; just serve the directory.

## File map

| File | Role |
| --- | --- |
| `datahub.html` | Main shell — React app, scroll choreography, dataset explorer, signal view |
| `hero.jsx` | Hero overlay — title, lat/long, stat cluster, typewriter terminal |
| `Living Layers.html` | Animated background — loaded as a full-bleed iframe |
| `tweaks-panel.jsx` | Design-token utilities used by the panel |
| `uploads/hero-bg.png` | Background photograph (2048×1153) |
| `data.json` | The "db" — ontology + records |
| `vercel.json` | Static-host routing and cache headers |
