# Picking `ai_system`: dataset / model / workflow / agent / node

The boundary is fuzzy. These five categories are how the registry distinguishes "kinds of AI artifact". Calibrate against existing records and against the headline claim of the source.

## `"dataset"` — a data corpus, no trained weights

The artifact is data, not a model: HuggingFace datasets, scraped corpora, curated benchmarks. Has no parameters (`params: "N/A"`). The `architecture` field describes modality/format instead of a neural network (`"Audio + Text (parquet)"`, `"Text (parquet)"`, `"Image + Text (webdataset)"`). The `language` field holds the natural language(s) of the data, not the programming language of any loader.

**The dominant value for HF dataset URLs and the canonical input to this skill.** Pattern: HF dataset URLs (`huggingface.co/datasets/...`), benchmark releases that ship data only, scraped or labeled corpora. If you can't point to "the trained checkpoint", it's a dataset.

## `"model"` — a single trained network

A standalone weights-and-architecture artifact: feed inputs, get outputs. No tool use, no multi-stage pipeline, no decision loop.

Existing records flagged `"model"`:
- BERT-large (`task: classify`, input_type: text)
- Pegasus-X (`task: summarize`, input_type: text)

Pattern: a single model name, a single forward pass, well-defined I/O.

## `"workflow"` — a pipeline of stages or a model used in a multi-step process

Often the released artifact composes a model with retrieval, decoding strategies, post-processing, or domain-specific orchestration. Sometimes the model is small but the *system* is the contribution.

Existing records flagged `"workflow"`:
- Whisper-large-v3 (`task: transcribe`, input_type: audio — multilingual transcription + translation pipeline)

Pattern: multiple components, or a model that's wrapped in a non-trivial inference procedure (diffusion sampling, retrieval, memory bank, multi-pass).

## `"agent"` — LLM driving tools / decisions in a loop, or designed for instruction-following use

The artifact is meant to *act* — accept arbitrary instructions, choose actions, sometimes call tools.

Existing records flagged `"agent"`:
- GPT-4 (`task: retrieve_information`, input_type: text — general-purpose instruction-following LLM)
- LLaVA-1.6 (`task: reason`, input_type: image — visual instruction tuning, vision+language interaction)

Pattern: general-purpose, instruction-tuned, designed to be driven by prompts.

## `"node"` — semantics TBD

Recently added to the vocabulary. No existing records use it yet. Confirm with the user before assigning.

## Decision shortcut

- Is the artifact a data corpus / benchmark — no weights, just data? → **`"dataset"`**.
- Is the artifact a single trained network with a single forward pass and a well-defined I/O contract? → **`"model"`**.
- Is the artifact a pipeline that orchestrates multiple stages, or a model whose inference involves non-trivial procedure (diffusion sampling, retrieval, memory bank, multi-pass)? → **`"workflow"`**.
- Is the artifact an instruction-tuned general-purpose system meant to be driven by prompts and chosen actions? → **`"agent"`**.
- Does the source describe something the user has labeled `"node"`? → ask before using.

When two fit, pick the one that better describes the *headline claim* in the abstract or dataset card. The abstract usually tells you what the authors think they shipped.
