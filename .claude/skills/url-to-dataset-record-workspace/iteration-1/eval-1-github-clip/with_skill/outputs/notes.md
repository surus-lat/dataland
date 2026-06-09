# Notes — openai/CLIP record

## Source
- URL: https://github.com/openai/CLIP
- Fetched via `scripts/fetch_metadata.py github openai/CLIP` (GitHub REST API)

## Verifiable from source
- `name`: CLIP
- `full_name`: openai/CLIP
- `description` (GitHub): "CLIP (Contrastive Language-Image Pretraining), Predict the most relevant text snippet given an image"
- `license`: MIT (spdx_id from GitHub)
- `language` (GitHub detected primary): Jupyter Notebook — but the reference implementation is a Python package (`import clip`), so the SKILL convention is `"Python"`.
- `created_at`: 2020-12-16 — repo pre-dates paper by a few weeks
- README references paper at https://arxiv.org/abs/2103.00020 (Feb 2021)

## Inference choices
- `year`: **2021** — paper publication year (Feb 2021), matches the convention used for BERT (id=1) which uses 2019 (publication) rather than 2018 (initial arxiv). The repo was created Dec 2020 but CLIP is universally cited as a 2021 release.
- `task`: **"Zero-Shot Image Classification"** — no existing task matches. CLIP's defining contribution is zero-shot transfer via text prompts; "Image Classification" alone would understate the novelty. Other plausible options ("Multimodal Reasoning", "Image Captioning") fit downstream uses but not what CLIP *is*.
- `domain`: **"Multimodal"** — matches BLIP-2 (id=4) and LLaVA-1.6 (id=12), which are also vision-language.
- `architecture`: **"Vision-Language"** — matches BLIP-2 and LLaVA-1.6 style. More specific would be "Dual-Encoder (ViT + Transformer)" but the existing convention favors a short noun phrase.
- `ai_system`: **"model"** — CLIP is a single trained dual-encoder that produces aligned embeddings. No multi-step pipeline, no tool use. Matches BERT, BLIP-2, YOLOv8.
- `language`: **"Python"** — per SKILL convention (reference implementation language, not GitHub detector output). The package is installed and imported as Python (`pip install git+...`, `import clip`).
- `params`: **"~400M"** — the CLIP release includes several variants (ViT-B/32 ~151M, ViT-B/16 ~150M, ViT-L/14 ~428M, plus ResNet variants). The largest/most-cited variant is ViT-L/14 at ~400M. Using approximate marker to reflect the family rather than a single checkpoint.
- `organization`: **"OpenAI"** — direct from the repo owner.
- `source_url`: kept as the user-provided GitHub URL verbatim.

## Repo state
- `/Users/dobleefe/dataland` is not a git repo (per task brief). Per `references/no-git-repo.md`, the record is built and saved; no PR opened. Next id should be **16** (current max is 15 = PatchCore).
