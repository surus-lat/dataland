# How to add a record

This guide shows how to contribute a new entry to the registry —
either by editing `data.json` by hand, or by using the
`url-to-dataset-record` skill to draft the record from a HuggingFace
dataset URL.

If you've never contributed to the registry before, start with the
[first-contribution tutorial](./tutorial-first-contribution.md). It
covers cloning, branch naming, and PR conventions end-to-end. This page
assumes you already have the repo and know the basics.

For the full schema, see [reference-schema.md](./reference-schema.md).

## Prerequisites

- Node.js (any modern version) — to run the validator
- `git` configured to push to the repo
- Optional: `python3` to preview the site locally
- Optional: Claude Code with the `url-to-dataset-record` skill, if you
  want HF datasets drafted automatically

One-time hook setup (recommended):

```sh
bash scripts/install-hooks.sh
```

This points `git` at the versioned `hooks/` directory so the validator
runs before every commit. Without it you can still validate manually
with `node scripts/validate-data.mjs`, and the Cloudflare build will
catch errors either way — but the local hook gives you the fastest
feedback loop.

## Path A — manual edit

Use this when you know the artifact's metadata firsthand: a model your
team trained, a dataset you curated, or anything you can describe
without a third-party page to scrape.

### Step 1: Read the current vocabularies

Open [`data.json`](../data.json). The top-level keys
(`tasks_supported`, `input_type`, `output_type`, `domains`, `languages`,
`licenses`, `contributing_organizations`) are the **only** legal values
for the matching record fields. Pick from these lists first.

If your record needs a value that isn't present — a new language code,
a new license, a new task verb — add it to the corresponding vocabulary
list **before** adding the record. Vocabulary additions are part of the
same PR.

Every record describes a **dataset**. There is no `ai_system`,
`architecture`, or `params` field. If your contribution is a model card
or an agent, this registry is not the right place for it.

### Step 2: Pick the next id

The id is `max(records[].id) + 1`. There's no auto-increment — pick the
next free integer yourself.

### Step 3: Build the record

Use this skeleton:

```jsonc
{
  "id": <next id>,
  "task": "<verb from tasks_supported>",
  "input_type": "<medium from input_type>",
  "output_type": "<medium from output_type>",
  "domain": "<knowledge grouping from domains>",
  "languages": ["<LATAM-first tag>", "..."],
  "organization": "<name from contributing_organizations>",
  "license": "<short form from licenses>",
  "model": "<display name of the dataset>",
  "year": <first-release year as int>,
  "source_url": "<canonical URL, tracking params stripped>",
  "description": "<2-3 dense factual sentences, ~250-450 chars>"
}
```

Field-by-field guidance lives in [reference-schema.md](./reference-schema.md#record-shape).
The three most-missed nuances:

- **`organization` is the upstream source, not the republisher.** For
  a HuggingFace mirror, that's the original corpus owner named in the
  README, not the HF account holder.
- **`languages` is an array.** List every variant the source page names
  (e.g. PRESEEA's 11 countries → 11 country codes). Use the coarse
  `["es"]` or `["pt"]` only when the source mentions Spanish/Portuguese
  but doesn't resolve sub-variants.
- **`Multilingual` means multiple *different* languages**, not multiple
  Spanish variants. A pan-Hispanic corpus is `["es"]` or a list of country codes.

### Step 4: Append the record

Append the record to the end of the `records` array (don't reorder
existing entries — it makes diffs noisier than they need to be). Insert
any vocabulary additions in alphabetical order within their lists.

### Step 5: Validate

```sh
node scripts/validate-data.mjs
```

Expected success output:

```
data.json: ok (N records, ...)
```

If the validator prints errors, fix them and re-run. The output names
the record id, the field, and the missing vocabulary, so the fix is
mechanical. Example error:

```
data.json: 1 error
  - record #6 ("google-argentinian-spanish"): language "es-Argentina" not in languages — add it to the list or change the record
```

Fix: change `"es-Argentina"` to `"es-AR"`, or — if `es-AR` were really
missing — add it to the `languages` array first.

### Step 6: Verify in the browser (optional but recommended)

```sh
python3 -m http.server 8000
```

Open <http://localhost:8000/> and confirm your record appears
in the explorer and that any vocabulary additions show up in the filter
options.

### Step 7: Commit and PR

Follow the branch and commit conventions in
[`CONTRIBUTING.md`](../CONTRIBUTING.md):

```sh
git checkout -b FEAT/add-<artifact-slug>
git add data.json
git commit -m "[ADD] <artifact name>"
git push -u origin FEAT/add-<artifact-slug>
gh pr create --base dev --title "[ADD] <artifact name>"
```

In the PR body, list every vocabulary addition explicitly so the
reviewer can see what's new beyond the record itself. Use this shape:

```markdown
**Source**: <source_url>
**Artifact**: <model>  ·  **Organization**: <organization>  ·  **Year**: <year>
**Inferred fields**: task=<task>, input_type=<input_type>, output_type=<output_type>, domain=<domain>, languages=<languages>
**Vocabulary additions**: <list each new entry, or "none">
```

## Path B — HuggingFace dataset via skill

Use this when adding a dataset from `huggingface.co/datasets/<owner>/<name>`.
The `url-to-dataset-record` skill handles fetching the dataset card,
mapping its metadata onto the registry schema, surfacing any vocabulary
additions, and drafting a PR. It's significantly more reliable than
extracting fields by eye.

### Step 1: Invoke the skill in Claude Code

Paste the HF dataset URL into the chat with intent ("add this dataset",
"register this collection") or type:

```
/url-to-dataset-record https://huggingface.co/datasets/<owner>/<name>
```

The skill is wired to:

- Fetch the dataset card metadata
- Read the current vocabularies from `data.json`
- Map HF fields onto registry fields (handling all the
  upstream-vs-republisher and regional-language nuances)
- Show you the proposed record and **every vocabulary addition** before
  doing anything else
- Wait for your approval before opening the PR

### Step 2: Review the proposed record

The skill shows the full JSON before committing. Sanity-check the four
fields where automated extraction sometimes drifts:

- `languages` — does the array list every variant the source page names?
  Coarse `["es"]` is for when sub-variants are genuinely unstated.
- `organization` — is this the **upstream source**, not the HF account
  holder? For `ylacombe/google-argentinian-spanish` the answer is
  `Google`, not `ylacombe`.
- `task` — is the verb right for the dataset's primary use? Speech
  corpora map to `transcribe`, QA corpora to `retrieve_information`,
  labeled text to `classify`.
- `description` — 2–3 dense factual sentences with quantitative scope.
  No marketing language.

If anything's off, tell the skill what to change. It'll redraft.

### Step 3: Approve and let the skill open the PR

After approval, the skill:

1. Creates a branch (`add-<slug>`)
2. Edits `data.json` (vocabulary additions first, then the record)
3. Runs the validator
4. Commits
5. Pushes
6. Opens a PR with a body that lists every vocabulary addition

It reports the PR URL back to you. You're done.

### Collections

For a HuggingFace collection URL (`huggingface.co/collections/<owner>/<slug>`),
the skill expands the collection into its items, shows you the list, and
asks which subset to import. `paper` and `space` items are skipped
automatically. You can pick "all" or a specific subset; each chosen item
becomes its own record.

## Path C — non-HuggingFace dataset URL

For Mozilla Data Collective and other non-HF dataset URLs, the skill
falls back to the `/scrape` skill (or `WebFetch` as a last resort) to
pull metadata from the page. The mapping into the registry schema is
the same as Path B. The skill currently lives in maintainer-side tooling;
ask if you'd like a copy.

For model cards, agent pages, or benchmark leaderboards — refuse. The
registry is datasets-only.

## Common pitfalls

| Mistake | Fix |
| --- | --- |
| Collapsed known sub-variants into `["es"]` | List the specific country codes the source names. Coarse `es` is for genuinely-unstated resolution. |
| Used `Multilingual` for Spanish-across-many-countries | `Multilingual` means multiple *different* languages. Use `["es"]` or list country codes. |
| Used `ylacombe` as `organization` for a Google corpus mirror | Use the upstream source (`Google`). The HF account holder is not the organization. |
| Wrote `task` as a noun (`"Speech Recognition"`) | Use a verb (`transcribe`). The action goes in `task`; the medium goes in `input_type`/`output_type`. |
| Added an `ai_system`, `architecture`, or `params` field | Drop them. They're not in the schema anymore. |
| Validator says "duplicate id" | The id collided with an existing record. Use `max(records[].id) + 1`. |
| Validator says "missing logo key" for an organization | Add `"logo": null` even when there's no logo. The key is required; its value can be null. |
| Validator says `"ontology" key must be removed` | Old schema. Promote the nested vocabularies to top-level keys. |

## Verification

After your PR is open:

- CI runs `build.sh`, which validates `data.json` first. If it fails,
  the build fails — same script, same rules as your local validator.
- Once merged to `main`, the Cloudflare Pages workflow in
  [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)
  rebuilds the site.

## Related

- [Tutorial: your first contribution](./tutorial-first-contribution.md) — newcomer walkthrough
- [Schema reference](./reference-schema.md) — every field, every rule
- [Why the schema looks this way](./explanation-design.md) — design rationale
- `url-to-dataset-record` skill — the HF dataset workflow (maintainer-side; ask for a copy)
