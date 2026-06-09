# Extracting fields from messy HTML

When no API path is available (`paperswithcode.com`, `nature.com`, journal sites, project pages), use WebFetch on the URL and extract the fields by hand. Some patterns that pay off:

## What to look for

- **Title** — `<title>` or the first `<h1>`. Strip site suffix (` | Papers With Code`, ` - Nature Methods`).
- **Authors / affiliations** — usually under the title; may be in a `<meta name="citation_author">` and `citation_author_institution` block (a lot of academic publishers expose these).
- **Abstract** — `<meta name="description">` or a `<section id="abstract">` / similar. Strip whitespace and unicode artifacts.
- **Year** — `<meta name="citation_publication_date">` or `<time datetime="…">`.
- **arxiv id** — papers-with-code, OpenReview, and Nature articles often link out to arxiv. If you find one, prefer `fetch_metadata.py arxiv <id>` over scraping — the arxiv API gives a clean abstract and a stable canonical URL.
- **Code link** — papers-with-code prominently links to a GitHub repo; if present, also call `fetch_metadata.py github <slug>` to pull license + topics + README excerpt. Combine both sources when building the record.

## Reading `<meta name="citation_…">` tags

Many academic publishers (Nature, Springer, IEEE, journals using Highwire) expose machine-readable metadata via meta tags:

```html
<meta name="citation_title" content="…">
<meta name="citation_author" content="Doe, Jane">
<meta name="citation_author_institution" content="DeepMind">
<meta name="citation_publication_date" content="2024/05/08">
<meta name="citation_doi" content="10.1038/s41586-024-07487-w">
<meta name="citation_pdf_url" content="…">
```

These are far more reliable than scraping the rendered body.

## Combining sources

A real-world record often draws from two places:

1. The paper page → `task`, `domain`, `description`, `year`, `organization` (lead author affiliation).
2. The code repo → `language`, `license`, sometimes a cleaner `model` name and parameter count.

When both exist, fetch both and reconcile:
- License: prefer the explicit `LICENSE` file in the repo over what the paper page says.
- `params`: prefer what the paper reports; fall back to the README if the paper is vague.
- `organization`: prefer the paper's lead-author affiliation over the GitHub org owner — a researcher's personal GitHub doesn't reflect institutional credit.

## When the page is gated

Some publisher pages return a paywall or login wall to non-browser User-Agents. WebFetch will see the same wall. In that case:

- Try the arxiv preprint URL if the paper has one (almost all ML papers do).
- Try the project page (e.g., `<lab>.github.io/<paper-slug>`) — it's usually publicly visible.
- If neither works, ask the user to paste the abstract directly. Don't invent fields just because the page didn't load.
