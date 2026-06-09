# When the dataland repo isn't ready for a PR

You cannot open a PR if:

- `/Users/dobleefe/dataland` is not a git repo (`git rev-parse --is-inside-work-tree` errors out).
- It is a git repo but has no remote (`git remote -v` is empty).
- `gh` CLI is not installed or not authenticated (`gh auth status` fails).

In any of these cases:

1. **Build the record anyway** — the value is in the JSON, and you can show it to the user.
2. **Save it to a temp file** so it isn't lost: `mktemp /tmp/dataland-record-XXXX.json` and write the single-record JSON.
3. **Print the record** to the conversation as a fenced JSON block, with the file path on a line below it.
4. **Diagnose what's missing** and tell the user the specific next step:
   - Not a git repo → `cd /Users/dobleefe/dataland && git init && git add -A && git commit -m "initial import"` and ask them to push to a GitHub remote.
   - Has a repo but no remote → ask which GitHub repo to push to; do not invent one.
   - No `gh` → tell them to install (`brew install gh`) and authenticate (`gh auth login`).
5. **Offer to re-run the skill** once they confirm git + remote + gh are in place. Don't loop indefinitely — one diagnostic pass, then hand it back.

Never:

- Run `git init` on the dataland directory without an explicit yes from the user. They may have intentional reasons it isn't a repo yet (e.g., still in design mode).
- Commit on a detached HEAD or push to `main` directly. Always branch first.
- Skip the PR step by editing `data.json` in place when there *is* a repo. The PR is the contract; in-place edits bypass review.
