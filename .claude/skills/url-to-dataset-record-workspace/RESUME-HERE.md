# Resume the skill evaluation later

State as of the last session: iteration-1 was run, 6 subagents produced 6 records,
all 12 quantitative assertions pass in both arms. Claude reviewed the outputs
and proposed improvements (see `iteration-1/claude-review.md`). Human review
is still pending.

## To resume in a future session

Tell Claude something like:

> "Continue the url-to-dataset-record skill iteration. Read
> `.claude/skills/url-to-dataset-record-workspace/RESUME-HERE.md`."

Claude will then:

1. Re-launch the viewer:
   ```sh
   SC="/Users/dobleefe/.claude/plugins/cache/claude-plugins-official/skill-creator/unknown/skills/skill-creator"
   WS=/Users/dobleefe/dataland/.claude/skills/url-to-dataset-record-workspace/iteration-1
   nohup python3 "$SC/eval-viewer/generate_review.py" \
     "$WS" --skill-name "url-to-dataset-record" \
     --benchmark "$WS/benchmark.json" \
     > /tmp/viewer.log 2>&1 &
   open http://127.0.0.1:3117/
   ```
2. Wait for you to click through each test case, leave feedback in the textbox,
   and hit **Submit All Reviews** — that downloads `feedback.json` to
   `~/Downloads/`.
3. Copy `feedback.json` into `iteration-1/`.
4. Read your feedback + the proposed improvements in `claude-review.md`,
   apply edits to `SKILL.md` / scripts / references, and spawn iteration-2.

## Where everything lives

- **Skill source**: `/Users/dobleefe/dataland/.claude/skills/url-to-dataset-record/`
- **Workspace**: `/Users/dobleefe/dataland/.claude/skills/url-to-dataset-record-workspace/`
- **Eval prompts**: `url-to-dataset-record/evals/evals.json`
- **Iteration-1 outputs**: `iteration-1/eval-{0,1,2}-.../{with_skill,without_skill}/outputs/record.json`
- **Iteration-1 gradings**: `iteration-1/eval-*/.../grading.json`
- **Claude's review notes**: `iteration-1/claude-review.md`
- **Skill-creator scripts**: `/Users/dobleefe/.claude/plugins/cache/claude-plugins-official/skill-creator/unknown/skills/skill-creator/`

## Loose ends

- The happy-path PR workflow (init repo, push branch, `gh pr create`) was **not tested**
  in iteration-1 — dataland isn't a git repo yet. Once you `git init` + add a
  GitHub remote, re-run one eval with the PR step enabled.
- The aggregate benchmark stats are 0/0 because `aggregate_benchmark.py` didn't
  recognize the grading.json execution_metrics shape. Cosmetic; pass-rate
  per-eval is correct in each grading.json.
- See `iteration-1/claude-review.md` for the concrete edits Claude proposes.
