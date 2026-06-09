#!/usr/bin/env python3
"""
Fetch raw metadata for a research artifact and emit normalized JSON the
SKILL.md workflow can map into a data.json record.

Usage:
    fetch_metadata.py hf <owner>/<model>           # huggingface model
    fetch_metadata.py hf-dataset <owner>/<name>    # huggingface dataset
    fetch_metadata.py hf-collection <url|slug>     # huggingface collection
                                                   # accepts either the bare
                                                   # /collections/<owner>/<slug>
                                                   # form or the canonical
                                                   # <slug>-<hash> form
    fetch_metadata.py arxiv <arxiv_id_or_url>      # arxiv paper
    fetch_metadata.py github <owner>/<repo>        # github repo

Output: JSON on stdout with the fields the source actually provides.
Inference (task, domain, ai_system, architecture) is left to the caller —
this script only returns what the source verifiably said.
"""

from __future__ import annotations

import json
import re
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET


def _http_get(url: str, accept: str = "application/json") -> bytes:
    req = urllib.request.Request(
        url,
        headers={
            "Accept": accept,
            "User-Agent": "dataland-url-to-record/1.0",
        },
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read()


# ── arxiv ─────────────────────────────────────────────────────────────────

ARXIV_ID_RE = re.compile(r"(\d{4}\.\d{4,5})(?:v\d+)?")


def fetch_arxiv(ref: str) -> dict:
    """ref may be an arxiv id (2303.08774) or a URL containing one."""
    m = ARXIV_ID_RE.search(ref)
    if not m:
        return {"error": f"could not extract arxiv id from {ref!r}"}
    arxiv_id = m.group(1)
    url = f"http://export.arxiv.org/api/query?id_list={arxiv_id}"
    raw = _http_get(url, accept="application/atom+xml")
    ns = {"a": "http://www.w3.org/2005/Atom",
          "arxiv": "http://arxiv.org/schemas/atom"}
    root = ET.fromstring(raw)
    entry = root.find("a:entry", ns)
    if entry is None:
        return {"error": f"no entry for arxiv id {arxiv_id}"}
    title = (entry.findtext("a:title", default="", namespaces=ns) or "").strip()
    summary = (entry.findtext("a:summary", default="", namespaces=ns) or "").strip()
    published = (entry.findtext("a:published", default="", namespaces=ns) or "").strip()
    authors = [a.findtext("a:name", namespaces=ns) or "" for a in entry.findall("a:author", ns)]
    affiliations = []
    for a in entry.findall("a:author", ns):
        aff = a.findtext("arxiv:affiliation", namespaces=ns)
        if aff:
            affiliations.append(aff)
    primary_cat = entry.find("arxiv:primary_category", ns)
    return {
        "source": "arxiv",
        "arxiv_id": arxiv_id,
        "title": title.replace("\n", " ").strip(),
        "abstract": " ".join(summary.split()),
        "authors": authors,
        "affiliations": affiliations,
        "primary_category": primary_cat.get("term") if primary_cat is not None else None,
        "year": int(published[:4]) if published[:4].isdigit() else None,
        "canonical_url": f"https://arxiv.org/abs/{arxiv_id}",
    }


# ── github ────────────────────────────────────────────────────────────────

def fetch_github(slug: str) -> dict:
    """slug = 'owner/repo' (or a github URL we parse down)."""
    m = re.search(r"github\.com/([^/\s]+)/([^/\s#?]+)", slug)
    if m:
        owner, repo = m.group(1), m.group(2)
    elif "/" in slug:
        owner, repo = slug.split("/", 1)
    else:
        return {"error": f"could not parse owner/repo from {slug!r}"}
    repo = repo.rstrip(".git")
    try:
        api = f"https://api.github.com/repos/{owner}/{repo}"
        meta = json.loads(_http_get(api))
    except urllib.error.HTTPError as e:
        return {"error": f"github api {e.code}: {e.reason}"}
    readme = ""
    try:
        readme_meta = json.loads(_http_get(f"{api}/readme"))
        # The 'download_url' returns raw README.
        if readme_meta.get("download_url"):
            readme = _http_get(readme_meta["download_url"], accept="text/plain").decode("utf-8", errors="replace")
            # Keep it short — first 4000 chars is plenty for the caller to read.
            readme = readme[:4000]
    except Exception:
        pass
    license_name = None
    if meta.get("license"):
        license_name = meta["license"].get("spdx_id") or meta["license"].get("name")
    return {
        "source": "github",
        "owner": owner,
        "repo": repo,
        "name": meta.get("name"),
        "full_name": meta.get("full_name"),
        "description": (meta.get("description") or "").strip(),
        "homepage": meta.get("homepage"),
        "language": meta.get("language"),  # GitHub's detected primary lang
        "license": license_name,
        "stars": meta.get("stargazers_count"),
        "topics": meta.get("topics", []),
        "year": int(meta.get("created_at", "")[:4]) if meta.get("created_at", "")[:4].isdigit() else None,
        "html_url": meta.get("html_url"),
        "readme_excerpt": readme,
    }


# ── huggingface ───────────────────────────────────────────────────────────

def fetch_hf(slug: str) -> dict:
    m = re.search(r"huggingface\.co/([^/\s]+)/([^/\s#?]+)", slug)
    if m:
        owner, model = m.group(1), m.group(2)
    elif "/" in slug:
        owner, model = slug.split("/", 1)
    else:
        return {"error": f"could not parse owner/model from {slug!r}"}
    try:
        api = f"https://huggingface.co/api/models/{owner}/{model}"
        meta = json.loads(_http_get(api))
    except urllib.error.HTTPError as e:
        return {"error": f"huggingface api {e.code}: {e.reason}"}
    card = ""
    try:
        card = _http_get(
            f"https://huggingface.co/{owner}/{model}/raw/main/README.md",
            accept="text/plain",
        ).decode("utf-8", errors="replace")[:4000]
    except Exception:
        pass
    return {
        "source": "huggingface",
        "owner": owner,
        "model": model,
        "pipeline_tag": meta.get("pipeline_tag"),  # e.g. "text-classification"
        "tags": meta.get("tags", []),
        "library_name": meta.get("library_name"),
        "downloads": meta.get("downloads"),
        "year": int(meta.get("createdAt", "")[:4]) if meta.get("createdAt", "")[:4].isdigit() else None,
        "url": f"https://huggingface.co/{owner}/{model}",
        "card_excerpt": card,
    }


# ── huggingface dataset ───────────────────────────────────────────────────

def fetch_hf_dataset(slug: str) -> dict:
    """Fetch a HuggingFace dataset's metadata + readme excerpt.

    Datasets have different API endpoints and a different field set than
    models. The interesting hints live in tags (e.g. ``language:es``,
    ``modality:audio``, ``task_categories:automatic-speech-recognition``) and
    in cardData (the parsed YAML front-matter of the README).
    """
    m = re.search(r"huggingface\.co/datasets/([^/\s]+)/([^/\s#?]+)", slug)
    if m:
        owner, name = m.group(1), m.group(2)
    elif "/" in slug:
        owner, name = slug.split("/", 1)
    else:
        return {"error": f"could not parse owner/dataset from {slug!r}"}
    try:
        api = f"https://huggingface.co/api/datasets/{owner}/{name}"
        meta = json.loads(_http_get(api))
    except urllib.error.HTTPError as e:
        return {"error": f"huggingface datasets api {e.code}: {e.reason}"}

    card = ""
    try:
        card = _http_get(
            f"https://huggingface.co/datasets/{owner}/{name}/raw/main/README.md",
            accept="text/plain",
        ).decode("utf-8", errors="replace")[:4000]
    except Exception:
        pass

    tags = meta.get("tags", []) or []
    card_data = meta.get("cardData") or {}

    # Pull out the interesting per-namespace tags so the caller doesn't have
    # to re-parse them (e.g. language:es-AR -> "es-AR").
    def _tag_values(prefix: str) -> list[str]:
        return [t.split(":", 1)[1] for t in tags
                if isinstance(t, str) and t.startswith(prefix + ":")]

    return {
        "source": "huggingface-dataset",
        "owner": owner,
        "name": name,
        "full_id": f"{owner}/{name}",
        "description": (meta.get("description") or "").strip(),
        "tags": tags,
        "languages": _tag_values("language"),         # natural-language codes
        "modalities": _tag_values("modality"),        # audio / text / image / …
        "task_categories": _tag_values("task_categories"),
        "size_categories": _tag_values("size_categories"),
        "license_tag": next(iter(_tag_values("license")), None),
        "card_license": card_data.get("license"),     # from YAML front-matter
        "card_languages": card_data.get("language"),  # may be list or string
        "card_pretty_name": card_data.get("pretty_name"),
        "downloads": meta.get("downloads"),
        "likes": meta.get("likes"),
        "year": int(meta.get("createdAt", "")[:4])
            if meta.get("createdAt", "")[:4].isdigit() else None,
        "url": f"https://huggingface.co/datasets/{owner}/{name}",
        "card_excerpt": card,
    }


# ── huggingface collection ────────────────────────────────────────────────

def _resolve_collection_slug(ref: str) -> tuple[str | None, str | None]:
    """Return (owner, canonical_slug_with_hash) or (None, None) on failure.

    The user-facing URL form is ``/collections/<owner>/<slug>`` but the API
    requires ``<slug>-<24-hex-hash>``. The bare URL redirects (server-side
    inlined) to the canonical form; we scrape it out of the HTML.
    """
    # Already canonical?
    m = re.search(r"collections/([^/\s]+)/([^/\s?#]+-[a-f0-9]{8,})", ref)
    if m:
        return m.group(1), m.group(2)
    # Bare slug form — fetch HTML and look for the canonical reference.
    m = re.search(r"collections/([^/\s]+)/([^/\s?#]+)", ref)
    if not m:
        return None, None
    owner, slug = m.group(1), m.group(2)
    try:
        html = _http_get(
            f"https://huggingface.co/collections/{owner}/{slug}",
            accept="text/html",
        ).decode("utf-8", errors="replace")
    except Exception:
        return None, None
    m2 = re.search(
        rf"collections/{re.escape(owner)}/({re.escape(slug)}-[a-f0-9]{{8,}})",
        html,
    )
    if m2:
        return owner, m2.group(1)
    return None, None


def fetch_hf_collection(ref: str) -> dict:
    """Fetch a HuggingFace collection. Returns the collection header plus a
    list of items (``type`` ∈ {model, dataset, paper, space}, plus the id).

    Collections are meta-resources: the caller is expected to iterate over
    ``items`` and call the appropriate fetcher per item.
    """
    owner, slug = _resolve_collection_slug(ref)
    if not owner or not slug:
        return {"error": f"could not resolve collection slug from {ref!r}"}
    try:
        api = f"https://huggingface.co/api/collections/{owner}/{slug}"
        meta = json.loads(_http_get(api))
    except urllib.error.HTTPError as e:
        return {"error": f"huggingface collections api {e.code}: {e.reason}"}
    items = []
    for it in meta.get("items", []) or []:
        items.append({
            "type": it.get("type"),       # model | dataset | paper | space
            "id": it.get("id"),           # owner/name or arxiv id
            "note": (it.get("note") or {}).get("text") if it.get("note") else None,
        })
    return {
        "source": "huggingface-collection",
        "owner": owner,
        "slug": slug,
        "title": meta.get("title"),
        "description": (meta.get("description") or "").strip(),
        "url": f"https://huggingface.co/collections/{owner}/{slug}",
        "item_count": len(items),
        "items": items,
    }


# ── dispatch ──────────────────────────────────────────────────────────────

DISPATCH = {
    "arxiv":         fetch_arxiv,
    "github":        fetch_github,
    "gh":            fetch_github,
    "hf":            fetch_hf,
    "huggingface":   fetch_hf,
    "hf-dataset":    fetch_hf_dataset,
    "hf-collection": fetch_hf_collection,
}


def main(argv: list[str]) -> int:
    if len(argv) < 3 or argv[1] not in DISPATCH:
        print(__doc__.strip(), file=sys.stderr)
        return 2
    source = argv[1]
    ref = argv[2]
    try:
        result = DISPATCH[source](ref)
    except Exception as e:  # surface errors as JSON so the caller can react
        result = {"error": f"{type(e).__name__}: {e}"}
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0 if "error" not in result else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
