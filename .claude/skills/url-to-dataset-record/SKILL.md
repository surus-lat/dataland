---
name: url-to-dataset-record
description: Use when the user pastes a URL (arxiv, GitHub, papers-with-code, Nature, HuggingFace, OpenReview, project page, etc.) and wants to add it to the dataland data.json registry. Fetches the URL, extracts metadata, infers missing fields (domain from abstract, ai_system as model/workflow/agent), builds a record in the long-key schema, and opens a pull request appending it to /Users/dobleefe/dataland/data.json. Triggers on phrases like "add this paper", "log this model", "register this dataset", "add this to the registry/datahub", "new record from <url>", or any time a research URL is dropped in the context of growing the registry. Strongly prefer using this skill — guessing fields by eye produces inconsistent records.
---

# URL → Dataset Record

Build one canonical record from one source URL and open a PR appending it to the dataland registry.

## When this skill applies

The dataland project (`/Users/dobleefe/dataland`) is a registry of ML datasets, models, and research artifacts. Its source of truth is a single file: `data.json`. Every record has the same long-key shape — read `data.json` to see real examples; do not rely on memory for the schema.

The user gives you a URL. You produce one record and open a PR.

## Workflow

### 1. Identify the source type

URL host tells you which extraction path is best. The deterministic paths are faster and more reliable than scraping HTML:

| Host pattern | Best extractor |
| --- | --- |
| `arxiv.org/abs/...` or `arxiv.org/pdf/...` | `scripts/fetch_metadata.py arxiv <id>` — uses the arxiv API |
| `github.com/<owner>/<repo>` | `scripts/fetch_metadata.py github <owner>/<repo>` — uses the GitHub REST API (no auth needed for public repos, lower rate limit) |
| `huggingface.co/<owner>/<model>` | `scripts/fetch_metadata.py hf <owner>/<model>` — uses the HF API |
| `paperswithcode.com/paper/<slug>` | WebFetch the page + extract |
| `openreview.net/forum?id=...` | WebFetch + extract; check for an arxiv link in the page and use the arxiv API instead if present |
| `nature.com/articles/...`, `science.org/...`, journal sites | WebFetch the page + extract |
| anything else | WebFetch the page and extract from HTML |

Run the script when applicable — it returns clean JSON that maps directly into the record. For sources without a script path, use WebFetch.

### 2. Read the current registry

Read `/Users/dobleefe/dataland/data.json` for two reasons:

1. **Determine the next id**: it is `max(records[].id) + 1`.
2. **Match the style**: skim 2–3 existing records to calibrate length, tone, and field conventions. E.g., `task` is title-case noun phrase, `description` is 2–3 dense sentences, `params` may be `"Unknown"` if not reported, `license` uses canonical short forms (`"MIT"`, `"Apache 2.0"`, `"CC-BY-NC 4.0"`, `"Proprietary"`).

Never hardcode the schema from memory. Read the file. Schemas drift; the file does not lie.

### 3. Build the record

Fill every field in `ontology.attributes` plus the primary dimensions (`task`, `domain`, `language`) plus `id` and `description`. Long keys, no abbreviations.

**Direct mapping (from fetched metadata):**
- `model` — the model/system/dataset name as published. Use the canonical name (`"BERT-large"`, not `"Bert (Devlin et al.)"`).
- `organization` — the primary affiliation. For multi-org papers, pick the lead author's affiliation, or the affiliation listed first. For GitHub: the org owner (`"Ultralytics"`), not a personal account when an org exists. For multi-affiliation prefer the most recognizable (`"Google DeepMind"` over `"Google"` when both apply).
- `year` — first publication / first release year, as an integer.
- `license` — short canonical form. See `references/license-table.md` for the canonical mapping.
- `source_url` — the URL the user provided, normalized (strip tracking params, prefer `arxiv.org/abs/<id>` over `pdf/`).
- `params` — parameter count as string with the unit: `"340M"`, `"3.3B"`, `"~25M"`, `"Unknown"`. If the artifact is a dataset rather than a model, use `"N/A"`.
- `description` — 2–3 sentences, dense, factual. Lead with what it is, then the novel mechanism, then a result if reported. Match the existing records' tone.

**Inferred fields (judgment required):**
- `task` — the *task type*, not the model name. Pick from existing values in `data.json` when one fits (`"Text Classification"`, `"Image Captioning"`, `"Code Generation"`, etc.). Create a new task name only when no existing one is close.
- `domain` — high-level field. Existing values include `"NLP"`, `"Multimodal"`, `"Code"`, `"Computer Vision"`, `"Audio"`, `"Biology"`, `"Chemistry"`, `"Time Series"`, `"Industrial AI"`. Same rule: reuse when close, invent only when distant.
- `architecture` — short noun phrase (`"Transformer (Encoder)"`, `"Vision-Language"`, `"Diffusion + Transformer"`, `"Graph Diffusion"`, `"CNN + Memory Bank"`). Read the abstract to identify the dominant component.
- `language` — programming language of the *reference implementation*, not the natural language the model handles. Almost always `"Python"` for modern ML work; default to it unless the README explicitly uses something else.
- `ai_system` — one of exactly three values:
    - `"model"` — a single trained model that takes inputs and produces outputs (BERT, YOLOv8, SAM).
    - `"workflow"` — a pipeline of multiple steps, often using a model plus retrieval, decoding strategies, or post-processing (Whisper-large-v3 fits because it includes a multilingual transcription+translation pipeline; AlphaFold 3 fits because it's a structure-prediction pipeline).
    - `"agent"` — an LLM driving tools/decisions in a loop, or one that's designed to be used agentically (GPT-4, CodeLlama-34B used for instruction-following).
    The boundary is fuzzy; use the existing records as anchor points and pick the closest match.

### 4. Confirm with the user before opening a PR

PRs are visible and irreversible. Show the draft record as a JSON block and the proposed PR title. Wait for approval. Take the user's edits seriously — they know the domain better than the fetched metadata.

### 5. Open the PR

Workflow assumes the repo is git-initialized with a remote and `gh` CLI authenticated. If not, see `references/no-git-repo.md` for the fallback (write the JSON to a temp file, tell the user the commands to set up the repo, then re-run).

```sh
cd /Users/dobleefe/dataland
git checkout -b add-<slug>          # slug = lowercase model name with dashes, e.g. "add-bert-large"
# edit data.json: insert the new record before the closing ]
git add data.json
git commit -m "Add <Model Name> to dataset registry"
git push -u origin add-<slug>
gh pr create --title "Add <Model Name>" --body "<one-line summary + source URL>"
```

Insert the new record at the **end** of the `records` array (before the closing `]`), preserving the trailing-newline convention and indentation of the existing file. Use a focused edit — never rewrite the whole file just to append one record.

Report the PR URL back to the user.

## Schema reference (always defer to data.json)

For the canonical shape, read `/Users/dobleefe/dataland/data.json`. The skill expects this top-level object:

```json
{
  "ontology": {
    "primary_dimensions": ["task", "domain", "language"],
    "attributes": ["model", "architecture", "ai_system", "organization", "params", "year", "license", "source_url"]
  },
  "records": [ /* … */ ]
}
```

Each record carries every key listed under `primary_dimensions` and `attributes`, plus `id` (auto-increment integer) and `description` (free-text 2–3 sentences).

## Reference material

When you need depth on a specific concern, consult these files — don't quote them inline in the main skill body:

- `references/license-table.md` — short-form mapping for common licenses.
- `references/ai_system-examples.md` — concrete examples of `"model"` vs `"workflow"` vs `"agent"` calls.
- `references/no-git-repo.md` — what to do when the repo isn't ready for a PR.
- `references/extraction-tips.md` — extracting fields from messy HTML when no API is available.

## Anti-patterns

- **Don't invent a `model` name.** If the page calls it "GPT-4", that's the name. Don't write "GPT-4 (OpenAI's flagship LLM)".
- **Don't bury the source.** `source_url` is the URL the user gave you, verbatim (minus tracking params). Not a rewritten "canonical" link unless it's clearly equivalent (arxiv pdf → abs).
- **Don't write a press release in `description`.** Match the existing tone: factual, dense, two-three sentences, no hype.
- **Don't open a PR without confirming.** A PR is an external artifact. Always show the JSON first and wait for approval.
- **Don't refactor `data.json` while appending.** Touch only the records array.
