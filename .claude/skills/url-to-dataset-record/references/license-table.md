# License normalization

Use the short canonical form on the right. The registry style is terse — match it.

| Raw / SPDX | Canonical for data.json |
| --- | --- |
| `MIT` | `MIT` |
| `Apache-2.0` / `apache_2.0` | `Apache 2.0` |
| `BSD-3-Clause` | `BSD 3-Clause` |
| `BSD-2-Clause` | `BSD 2-Clause` |
| `GPL-3.0` | `GPL-3.0` |
| `AGPL-3.0` | `AGPL-3.0` |
| `MPL-2.0` | `MPL-2.0` |
| `CC-BY-4.0` / `cc_by_4_0` | `CC-BY 4.0` |
| `CC-BY-SA-4.0` | `CC-BY-SA 4.0` |
| `CC-BY-NC-4.0` | `CC-BY-NC 4.0` |
| `CC0-1.0` | `CC0` |
| `LLAMA2` / "Llama 2 Community License" | `Llama 2 Community` |
| (research-only / non-commercial language) | `Non-commercial` |
| (proprietary, closed weights) | `Proprietary` |
| (not stated anywhere) | `Unknown` |

Examples in the registry: `"Apache 2.0"`, `"MIT"`, `"CC-BY-NC 4.0"`, `"BSD 3-Clause"`, `"AGPL-3.0"`, `"Llama 2 Community"`, `"Non-commercial"`, `"Proprietary"`.

If the source page doesn't specify a license and the GitHub repo has no `LICENSE` file, write `"Unknown"`. Never invent.
