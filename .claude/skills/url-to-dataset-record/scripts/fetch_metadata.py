#!/usr/bin/env python3
"""
Fetch raw metadata for a research artifact and emit normalized JSON the
SKILL.md workflow can map into a data.json record.

Usage:
    fetch_metadata.py arxiv <arxiv_id_or_url>
    fetch_metadata.py github <owner>/<repo>
    fetch_metadata.py hf <owner>/<model>

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


# ── dispatch ──────────────────────────────────────────────────────────────

DISPATCH = {
    "arxiv":  fetch_arxiv,
    "github": fetch_github,
    "gh":     fetch_github,
    "hf":     fetch_hf,
    "huggingface": fetch_hf,
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
