# Picking `ai_system`: model / workflow / agent / dataset

The boundary is fuzzy. These four categories are how the registry distinguishes "kinds of AI artifact". Calibrate against existing records.

## `"model"` — a single trained network

A standalone weights-and-architecture artifact: feed inputs, get outputs. No tool use, no multi-stage pipeline, no decision loop.

Existing records flagged `"model"`:
- BERT-large (Text Classification, encoder)
- NLLB-200 (Machine Translation, seq2seq)
- BLIP-2 (Image Captioning)
- YOLOv8 (Object Detection)
- SAM 2 (Semantic Segmentation)
- Pegasus-X (Text Summarization)

Pattern: a single model name, a single forward pass, well-defined I/O.

## `"workflow"` — a pipeline of stages or a model used in a multi-step process

Often the released artifact composes a model with retrieval, decoding strategies, post-processing, or domain-specific orchestration. Sometimes the model is small but the *system* is the contribution.

Existing records flagged `"workflow"`:
- Whisper-large-v3 (Speech Recognition — multilingual transcription + translation pipeline)
- AlphaFold 3 (Protein Structure — diffusion module + pairformer + atom-coordinate processing)
- DiffSBDD (Molecule Generation — 3D equivariant diffusion conditioned on protein pocket geometry)
- AudioLDM 2 (Audio Generation — AudioMAE + LM + latent diffusion in a shared latent space)
- Chronos-T5 (Time Series Forecasting — tokenization + LM framework)
- PatchCore (Anomaly Detection — pretrained feature extractor + coreset memory bank + distance scoring)

Pattern: multiple components, or a model that's wrapped in a non-trivial inference procedure.

## `"agent"` — LLM driving tools / decisions in a loop, or designed for instruction-following use

The artifact is meant to *act* — accept arbitrary instructions, choose actions, sometimes call tools.

Existing records flagged `"agent"`:
- GPT-4 (Question Answering — general-purpose instruction-following LLM)
- CodeLlama-34B (Code Generation — instruction-tuned, infilling, long context for autonomous coding)
- LLaVA-1.6 (Multimodal Reasoning — visual instruction tuning, designed for vision+language interaction)

Pattern: general-purpose, instruction-tuned, designed to be driven by prompts.

## `"dataset"` — a data corpus, no trained weights

The artifact is data, not a model: HuggingFace datasets, scraped corpora, curated benchmarks. Has no parameters (`params: "N/A"`). The `architecture` field describes modality/format instead of a neural network (`"Audio + Text (parquet)"`, `"Text (parquet)"`, `"Image + Text (webdataset)"`). The `language` field holds the natural language(s) of the data, not the programming language of any loader.

Existing records flagged `"dataset"`:
- *(none yet — the registry started life with only models. Datasets are a new category being added now.)*

Pattern: HF dataset URLs (`huggingface.co/datasets/...`), benchmark releases that ship data only, scraped or labeled corpora. If you can't point to "the trained checkpoint", it's a dataset.

## Decision shortcut

- Is the artifact a data corpus / benchmark — no weights, just data? → **`"dataset"`**.
- Is the artifact a single trained network with a single forward pass and a well-defined I/O contract? → **`"model"`**.
- Is the artifact a pipeline that orchestrates multiple stages, or a model whose inference involves non-trivial procedure (diffusion sampling, retrieval, memory bank, multi-pass)? → **`"workflow"`**.
- Is the artifact an instruction-tuned general-purpose system meant to be driven by prompts and chosen actions? → **`"agent"`**.

When two fit, pick the one that better describes the *headline claim* in the abstract. The abstract usually tells you what the authors think they shipped.
