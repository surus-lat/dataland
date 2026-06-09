# Mamba (arxiv 2312.00752) -> data.json record

## Status

Record built but PR not opened. Per the user's instruction and the skill's
`references/no-git-repo.md` fallback, `/Users/dobleefe/dataland` is not a git
repo (`git rev-parse --is-inside-work-tree` errored), so the standard
branch/commit/push/`gh pr create` flow can't run.

The single-record JSON object is in `record.json` in this folder, ready to be
appended to the `records` array in `/Users/dobleefe/dataland/data.json`.

## Field choices (and why)

- `id`: 16. `max(records[].id)` in the current `data.json` is 15.
- `model`: "Mamba" — canonical name from the paper title.
- `task`: "Language Modeling" — Mamba is a general sequence backbone but its
  headline evaluations are language modeling (Mamba-3B vs Transformers).
  No existing record uses this task; the closest existing values (Text
  Classification, Text Summarization, Question Answering) are all narrower
  downstream tasks, so a new task name is justified.
- `domain`: "NLP" — reuses existing value; the headline modality is language,
  even though the abstract mentions audio and genomics.
- `language`: "Python" — default for modern ML; the reference implementation
  (state-spaces/mamba on GitHub) is Python.
- `architecture`: "Selective State Space Model" — the paper's central novel
  architectural component (selective SSM with input-dependent parameters,
  no attention or MLP blocks).
- `ai_system`: "model" — single trained model that takes inputs and produces
  outputs, matching the anchors BERT-large and NLLB-200.
- `organization`: "Carnegie Mellon University" — lead author Albert Gu's
  affiliation at time of publication. (Tri Dao was at Princeton; arXiv API
  did not return affiliations, this is from public knowledge.)
- `params`: "3B" — the headline Mamba-3B model size from the abstract.
- `year`: 2023 — first arXiv submission (December 2023).
- `license`: "Apache 2.0" — license of the official state-spaces/mamba repo.
- `source_url`: the URL the user provided, verbatim.
- `description`: 3 sentences, factual, matching existing tone — what it is
  (linear-time SSM backbone with input-dependent params), the novel
  mechanism (hardware-aware parallel recurrent algorithm, no attention/MLP),
  and the headline result (5x throughput, Mamba-3B matches 2x-size
  Transformers, SOTA across language/audio/genomics).

## To finish opening the PR

The user needs to set up git and a remote first. Suggested next steps:

```sh
cd /Users/dobleefe/dataland
git init
git add -A
git commit -m "initial import"
# create a GitHub repo (e.g. via `gh repo create <name> --public --source=. --remote=origin --push`)
```

Once git + remote + `gh auth status` are all good, re-run the skill on the
same URL (https://arxiv.org/abs/2312.00752) and it will:

1. Append the record from `record.json` to the end of the `records` array
   in `data.json` (before the closing `]`, preserving indentation).
2. Branch `add-mamba`, commit "Add Mamba to dataset registry", push.
3. `gh pr create --title "Add Mamba" --body "..."` and report the PR URL.
