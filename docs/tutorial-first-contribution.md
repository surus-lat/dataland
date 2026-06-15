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
draft the record from a HuggingFace URL. We'll do the manual path in
this tutorial so the flow is visible — the skill path is covered in the
[how-to](./howto-add-record.md#path-b--huggingface-dataset-via-skill).

## Step 1: Clone the repo and run the site

```sh
git clone https://github.com/<your-account>/dataland.git
cd dataland
python3 -m http.server 8000
```

Open <http://localhost:8000/datahub.html>.

You should see the Datahub hero with a stat cluster ("Domains",
"Languages", "Organizations", "AI Systems") and a searchable explorer
below. Five records are visible — BERT, GPT-4, Whisper, Pegasus-X,
LLaVA. That's the starting state.

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

We'll add **`ylacombe/google-argentinian-spanish`** — Google's
crowd-sourced Argentinian Spanish read-speech corpus, mirrored on
HuggingFace. It's a strong LATAM-first record: Argentinian region,
indigenous-to-Latin-America focus on local Spanish.

Open the dataset card in your browser:
<https://huggingface.co/datasets/ylacombe/google-argentinian-spanish>.

Scan it for:

- **Upstream source** — the README usually credits the original corpus
  owner. For this dataset it's Google.
- **License** — listed on the right sidebar. Note the short form
  (`cc-by-sa-4.0`).
- **Year** — when the upstream corpus was first released, not when it
  was uploaded to HF. The README will say.
- **Description fields** — what's in it, how it was collected, how
  large it is (hours of audio, number of speakers).

## Step 4: Read the current vocabularies

Open [`data.json`](../data.json). Scroll to the top.

You'll see top-level keys: `tasks_supported`, `input_types`, `domains`,
`languages`, `ai_systems`, `architectures`, `licenses`,
`contributing_organizations`. These are the **only** legal values for
the matching record fields. Adding a value not on these lists makes
the validator fail.

For our record we need:

| Field | Value | Already in vocab? |
| --- | --- | --- |
| `task` | `transcribe` | ✓ in `tasks_supported` |
| `input_type` | `audio` | ✓ in `input_types` |
| `domain` | `general` | ✓ in `domains` |
| `language` | `es-AR` | ✓ in `languages` |
| `ai_system` | `dataset` | ✓ in `ai_systems` |
| `architecture` | `Audio + Text (parquet)` | ✗ not yet in `architectures` — we'll add it |
| `organization` | `Google` | ✓ already in `contributing_organizations` |
| `license` | `CC-BY-SA 4.0` | ✗ not yet in `licenses` — we'll add it |

Two vocabulary additions needed: one architecture descriptor and one
license. Note these — every vocabulary addition will need to be called
out in the PR body so reviewers see what's new.

## Step 5: Edit `data.json`

Make two vocabulary additions and one record addition. Edit
`architectures`:

```jsonc
"architectures": [
  "Audio + Text (parquet)",        // ← new
  "Transformer (Decoder)",
  "Transformer (Encoder)",
  "Transformer (Seq2Seq)",
  "Vision-Language"
],
```

Edit `licenses`:

```jsonc
"licenses": [
  "Apache 2.0",
  "CC-BY-SA 4.0",                  // ← new
  "MIT",
  "Proprietary"
],
```

(Keep entries alphabetical within each list — it makes diffs predictable.)

Now scroll to the end of `records` and append:

```jsonc
{
  "id": 6,
  "task": "transcribe",
  "input_type": "audio",
  "domain": "general",
  "language": "es-AR",
  "ai_system": "dataset",
  "architecture": "Audio + Text (parquet)",
  "organization": "Google",
  "license": "CC-BY-SA 4.0",
  "model": "google-argentinian-spanish",
  "params": "N/A",
  "year": 2020,
  "source_url": "https://huggingface.co/datasets/ylacombe/google-argentinian-spanish",
  "description": "Crowd-sourced read-speech corpus of Argentinian Spanish from Google — short utterances paired with transcripts, originally released to enable LATAM-targeted TTS and ASR research. The HF mirror packages the original Google distribution into parquet shards for streaming."
}
```

Don't forget the comma after the LLaVA entry that precedes it.

## Step 6: Run the validator

```sh
node scripts/validate-data.mjs
```

Expected output:

```
data.json: ok (6 records, 8 tasks, 3 organizations)
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
<http://localhost:8000/datahub.html>.

You should see:

- A new card in the explorer for `google-argentinian-spanish`
- The "Languages" stat unchanged (it counts the vocabulary, not the
  records — `es-AR` was already there)
- Filter options for `transcribe`, `audio`, `dataset`, `es-AR` returning
  the new entry

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
gh pr create --base dev --title "[ADD] google-argentinian-spanish dataset" --body "$(cat <<'EOF'
**Source**: https://huggingface.co/datasets/ylacombe/google-argentinian-spanish
**Artifact**: google-argentinian-spanish  ·  **Organization**: Google  ·  **Year**: 2020
**Inferred fields**: task=transcribe, input_type=audio, domain=general, language=es-AR, ai_system=dataset

**Vocabulary additions**:
- `architectures`: `Audio + Text (parquet)`
- `licenses`: `CC-BY-SA 4.0`
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
