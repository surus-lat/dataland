#!/usr/bin/env node
// Regenerate the auto-updated blocks in README.md.
// Source of truth: scripts/tools-registry.json + data.json. Runs in build.sh.
// Blocks are bounded by HTML comment markers and only their inner content
// is rewritten — the surrounding prose is preserved.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const registryPath = resolve(here, 'tools-registry.json');
const dataPath = resolve(here, '..', 'data.json');
const readmePath = resolve(here, '..', 'README.md');

function block(name, content) {
  return `<!-- BEGIN ${name} -->\n${content}\n<!-- END ${name} -->`;
}

function splice(readme, name, content) {
  const start = `<!-- BEGIN ${name} -->`;
  const end = `<!-- END ${name} -->`;
  const s = readme.indexOf(start);
  const e = readme.indexOf(end);
  if (s < 0 || e < 0) {
    throw new Error(`gen-readme: markers ${start} / ${end} not found in README.md`);
  }
  return readme.slice(0, s) + block(name, content) + readme.slice(e + end.length);
}

// ── TOOLS block ──
const { tools } = JSON.parse(readFileSync(registryPath, 'utf8'));
const toolsBody = tools.length
  ? [
      '| skill | what it does | requires | home |',
      '| --- | --- | --- | --- |',
      ...tools.map(t => `| \`${t.name}\` | ${t.what} | ${t.requires} | ${t.home} |`),
    ].join('\n')
  : '`::missing data::`';

// ── STATE block (live numbers from data.json) ──
const d = JSON.parse(readFileSync(dataPath, 'utf8'));
const usedLangs = new Set();
for (const r of d.records) for (const l of (r.languages || [])) usedLangs.add(l);
const usedDomains = new Set(d.records.map(r => r.domain));
const usedTasks = new Set(d.records.map(r => r.task));
const stateBody = [
  '| axis | declared | touched by a record |',
  '| --- | --- | --- |',
  `| records | ${d.records.length} | — |`,
  `| tasks | ${d.tasks_supported.length} | ${usedTasks.size} |`,
  `| domains | ${d.domains.length} | ${usedDomains.size} |`,
  `| languages | ${d.languages.length} | ${usedLangs.size} |`,
  `| organizations | ${d.contributing_organizations.length} | — |`,
].join('\n');

let readme = readFileSync(readmePath, 'utf8');
const next = splice(splice(readme, 'TOOLS', toolsBody), 'STATE', stateBody);
if (next !== readme) {
  writeFileSync(readmePath, next);
  console.log(`gen-readme: README.md updated (tools=${tools.length}, records=${d.records.length}).`);
} else {
  console.log('gen-readme: README.md already current.');
}
