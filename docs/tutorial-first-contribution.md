# Tutorial — your first contribution

You're going to add a real entry to the registry — a small LATAM Spanish
dataset — and see it appear in the running site. By the end of this
walkthrough you'll have:

- A working local copy of the registry running in your browser
- One new record added to `data.json`
- The validator passing
- A pull request open against `dev`

It takes about 20 minutes start to finish. Most of that is reading the
dataset card, not editing the file.

## What you'll need

- `git` and a GitHub account
- Node.js (any modern version) for the validator
- `python3` for the local web server (preinstalled on macOS / most Linux)
- A web browser

Optional: Claude Code with the `url-to-dataset-record` skill, which can
draft the record from a HuggingFace or Mozilla Data Collective URL. We'll
do the manual path in this tutorial so the flow is visible — the skill
path is covered in the [how-to](./howto-add-record.md#path-b--huggingface-dataset-via-skill).

## Step 1: Clone the repo and run the site

```sh
git clone https://github.com/<your-account>/dataland.git
cd dataland
python3 -m http.server 8000
```

Open <http://localhost:8000/>.

You should see the Datahub hero with a stat cluster ("Domains",
"Languages", "Organizations") and a searchable explorer below. A handful
of LATAM Spanish speech corpora are visible — PRESEEA, CordeBA,
google-argentinian-spanish, Common Voice, VoxForge. That's the starting
state.

Leave the server running. You'll come back to this tab.

## Step 2: Install the pre-commit hook

In a second terminal:

```sh
cd /path/to/dataland
bash scripts/install-hooks.sh
```

Expected output:

```
Git hooks now point at hooks
```

From now on, every commit in this repo runs the validator first. This
saves you from pushing broken data.

## Step 3: Pick a dataset to add

We'll add **`marianbasti/mlqe-spanish`** as a worked example — a small
Argentinian Spanish read-speech corpus on HuggingFace. (Substitute any
real dataset you want to contribute.)

Scan its dataset card for:

- **Upstream source** — the README usually credits the original corpus
  owner. For HF mirrors of older corpora, this is who *built* the
  dataset, not who *re-uploaded* it.
- **License** — listed on the right sidebar. Note the short form
  (e.g. `cc-by-sa-4.0`).
- **Year** — when the upstream corpus was first released, not when it
  was uploaded to HF.
- **Sub-language coverage** — if the card lists specific countries or
  accents (e.g. "Argentinian, Mexican, Chilean"), you'll list each one
  in the `languages` array.
- **Description fields** — what's in it, how it was collected, how
  large it is (hours of audio, number of speakers), format details
  (MP3/WAV/parquet/TSV).

## Step 4: Read the current vocabularies

Open [`data.json`](../data.json). Scroll to the top.

You'll see top-level keys: `tasks_supported`, `input_type`,
`output_type`, `domains`, `languages`, `licenses`,
`contributing_organizations`. These are the **only** legal values for
the matching record fields. Adding a value not on these lists makes
the validator fail.

For a typical Argentinian Spanish ASR corpus record we need:

| Field | Value | Already in vocab? |
| --- | --- | --- |
| `task` | `transcribe` | ✓ in `tasks_supported` |
| `input_type` | `audio` | ✓ in `input_type` |
| `output_type` | `text` | ✓ in `output_type` |
| `domain` | `general` | ✓ in `domains` |
| `languages` | `["es-AR"]` | ✓ `es-AR` in `languages` |
| `organization` | the upstream source | ✓ or ✗ — check |
| `license` | (whatever the card says) | ✓ or ✗ — check |

If anything's missing, add it to the vocab list before adding the
record. Every vocabulary addition needs to be called out in the PR
body so reviewers see what's new.

## Step 5: Edit `data.json`

Append at the end of `records`:

```jsonc
{
  "id": <next id>,
  "task": "transcribe",
  "input_type": "audio",
  "output_type": "text",
  "domain": "general",
  "languages": ["es-AR"],
  "organization": "<upstream source>",
  "license": "<short form>",
  "model": "<dataset display name>",
  "year": <year>,
  "source_url": "<canonical URL>",
  "description": "<2–3 dense factual sentences, include format details>"
}
```

Don't forget the comma after the previous record.

## Step 6: Run the validator

```sh
node scripts/validate-data.mjs
```

Expected output:

```
data.json: ok (<N> records, 1 tasks, <M> organizations)
```

If you see an error, the validator names exactly which record, which
field, and which vocabulary is involved. Example:

```
data.json: 1 error
  - record #6 ("google-argentinian-spanish"): language "es-Argentina" not in languages — add it to the list or change the record
```

Fix: change `"es-Argentina"` to `"es-AR"`.

If you see warnings instead of errors, the commit will still go through —
warnings are informational. The most common one is "vocabulary entry
has no records using it", which surfaces unused entries for cleanup.

## Step 7: See it in the browser

Go back to the browser tab from Step 1 and refresh
<http://localhost:8000/>.

You should see:

- A new row in the explorer for your dataset
- The "Languages" stat unchanged (it counts the vocabulary, not the
  records — `es-AR` was already there)
- Search for `transcribe`, `audio`, `es-AR` returns the new entry

If the new record doesn't appear, hard-refresh (Cmd+Shift+R / Ctrl+Shift+R)
to bust the browser cache.

## Step 8: Commit and push

Branch and commit conventions live in [`CONTRIBUTING.md`](../CONTRIBUTING.md).
Features land on `dev`, not `main`, and feature branches use the
`FEAT/<name>` prefix.

```sh
git checkout -b FEAT/add-google-argentinian-spanish
git add data.json
git commit -m "[ADD] google-argentinian-spanish dataset"
```

The pre-commit hook runs the validator. If you missed an edit, the
commit aborts with the same error format you saw in Step 6. Fix and
re-commit.

```sh
git push -u origin FEAT/add-google-argentinian-spanish
```

## Step 9: Open the PR

```sh
gh pr create --base dev --title "[ADD] <dataset name>" --body "$(cat <<'EOF'
**Source**: <source_url>
**Artifact**: <dataset name>  ·  **Organization**: <organization>  ·  **Year**: <year>
**Inferred fields**: task=transcribe, input_type=audio, output_type=text, domain=general, languages=["es-AR"]

**Vocabulary additions**:
- `<vocab>`: `<new entry>` (or "none")
EOF
)"
```

Don't have `gh` installed? Open the PR through the GitHub UI with the
same body.

The PR triggers the Cloudflare Pages build, which runs the validator as
its first step. If validation fails in CI, the build fails — same script,
same rules as your local validator.

## What you built

You added a real LATAM-first record to the registry, made the two
vocabulary additions it needed, and opened a PR with both calls clearly
flagged. The same flow scales to any artifact you want to add: pick the
vocabularies, write the record, validate, commit.

Once your PR merges to `dev` and then to `main`, the Cloudflare Pages
workflow republishes the site automatically.

Next steps:

- [How to add a record](./howto-add-record.md) — the same flow as
  reference, plus the HuggingFace skill path for automating dataset
  ingestion
- [Schema reference](./reference-schema.md) — every field, every vocab,
  every validator rule
- [Why the schema looks this way](./explanation-design.md) — design
  rationale, including why the language vocabulary is shaped the way
  it is
