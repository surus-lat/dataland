# Notes: microsoft/phi-2 record

## Source
- URL: https://huggingface.co/microsoft/phi-2
- Fetched via `scripts/fetch_metadata.py hf microsoft/phi-2`

## Direct mappings
- `model`: "Phi-2" — canonical name as published on the HF card ("Phi-2 is a Transformer with 2.7 billion parameters").
- `organization`: "Microsoft" — owner is `microsoft`; card is published by Microsoft Research.
- `year`: 2023 — HF `createdAt` year.
- `license`: "MIT" — HF tag `license:mit` and YAML front-matter `license: mit`.
- `source_url`: HF URL provided by the user, verbatim.
- `params`: "2.7B" — card states "2.7 billion parameters".
- `description`: Two dense sentences summarizing (1) what it is + training mix, (2) benchmark positioning and the no-RLHF note. Matches existing records' tone.

## Inferred fields
- `task`: "Text Generation" — HF `pipeline_tag` is `text-generation`. No existing record uses this exact label, but the registry already includes tasks like "Code Generation" / "Image Captioning"; "Text Generation" is the closest standard task name for a base LLM whose primary use is generative QA/chat/code completion.
- `domain`: "NLP" — existing value; card tags include `nlp` and `en` (English language model). Card mentions code as a secondary use but the primary domain is NLP.
- `architecture`: "Transformer (Decoder)" — matches existing values (GPT-4, CodeLlama-34B). Phi-2 is a decoder-only Transformer LM.
- `language`: "Python" — reference implementation runs via HF `transformers` (Python).
- `ai_system`: "model" — Phi-2 is a single pretrained model with no built-in retrieval, tool use, or pipeline wrapping. It is *used* generatively but is not RLHF-tuned for agentic use; the card explicitly positions it as a research base model. Chose "model" over "agent" following the existing convention (BERT-large, BLIP-2, SAM 2 are all "model"; only RLHF/instruction-tuned LLMs like GPT-4 and CodeLlama-34B are tagged "agent").

## Next id
- Read `data.json`: highest existing `id` is 15 → next is **16**.

## PR
- Skipped: `/Users/dobleefe/dataland` is not a git repository (`git rev-parse --is-inside-work-tree` errors with "not a git repository"). Per `references/no-git-repo.md`, built the record and saved it for the user. To proceed to a PR they would need:
  1. `cd /Users/dobleefe/dataland && git init && git add -A && git commit -m "initial import"`
  2. Create a GitHub remote and push.
  3. Ensure `gh` CLI is installed and authenticated (`gh auth status`).
  4. Re-run the skill to open the PR.
