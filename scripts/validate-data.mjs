#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = resolve(__dirname, '..', 'data.json');

const errors = [];
const warnings = [];

const fail = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

let data;
try {
  data = JSON.parse(readFileSync(DATA_PATH, 'utf8'));
} catch (e) {
  console.error(`data.json: failed to parse — ${e.message}`);
  process.exit(1);
}

const VOCAB_KEYS = [
  'tasks_supported',
  'input_types',
  'domains',
  'languages',
  'ai_systems',
  'architectures',
  'licenses',
];

for (const k of VOCAB_KEYS) {
  if (!Array.isArray(data[k])) fail(`top-level: "${k}" must be an array`);
}
if (!Array.isArray(data.contributing_organizations)) {
  fail('top-level: "contributing_organizations" must be an array of {name, logo}');
}
if (!Array.isArray(data.records)) {
  fail('top-level: "records" must be an array');
}
if ('ontology' in data) {
  fail('top-level: legacy "ontology" key must be removed — vocabularies live at the top level now');
}

if (errors.length) {
  printReport();
  process.exit(1);
}

const orgNames = new Set(
  data.contributing_organizations.map((o, i) => {
    if (!o || typeof o.name !== 'string') {
      fail(`contributing_organizations[${i}]: missing string "name"`);
      return null;
    }
    if (!('logo' in o)) {
      fail(`contributing_organizations[${i}] ("${o.name}"): missing "logo" key (use null if none)`);
    }
    return o.name;
  })
);

const FIELD_TO_VOCAB = {
  task: 'tasks_supported',
  input_type: 'input_types',
  domain: 'domains',
  language: 'languages',
  ai_system: 'ai_systems',
  architecture: 'architectures',
  license: 'licenses',
};

const REQUIRED_FIELDS = [
  'id',
  'task',
  'input_type',
  'domain',
  'language',
  'ai_system',
  'architecture',
  'organization',
  'license',
  'model',
  'params',
  'year',
  'source_url',
  'description',
];

const used = Object.fromEntries(VOCAB_KEYS.map((k) => [k, new Set()]));
const usedOrgs = new Set();
const seenIds = new Set();

for (const r of data.records) {
  const label = `record #${r?.id ?? '?'}${r?.model ? ` ("${r.model}")` : ''}`;

  for (const f of REQUIRED_FIELDS) {
    if (!(f in r)) fail(`${label}: missing field "${f}"`);
  }

  if (typeof r.id === 'number') {
    if (seenIds.has(r.id)) fail(`${label}: duplicate id`);
    seenIds.add(r.id);
  }

  for (const [field, vocabKey] of Object.entries(FIELD_TO_VOCAB)) {
    const value = r[field];
    if (value === undefined) continue;
    const vocab = data[vocabKey];
    if (!vocab.includes(value)) {
      fail(`${label}: ${field} "${value}" not in ${vocabKey} — add it to the list or change the record`);
    } else {
      used[vocabKey].add(value);
    }
  }

  if (typeof r.organization === 'string') {
    if (!orgNames.has(r.organization)) {
      fail(`${label}: organization "${r.organization}" not in contributing_organizations — add it to the list or change the record`);
    } else {
      usedOrgs.add(r.organization);
    }
  }
}

for (const k of VOCAB_KEYS) {
  for (const v of data[k]) {
    if (!used[k].has(v)) warn(`${k}: "${v}" is in the vocabulary but no record uses it`);
  }
}
for (const name of orgNames) {
  if (name && !usedOrgs.has(name)) warn(`contributing_organizations: "${name}" is listed but no record references it`);
}

printReport();
process.exit(errors.length ? 1 : 0);

function printReport() {
  if (errors.length) {
    console.error(`data.json: ${errors.length} error${errors.length === 1 ? '' : 's'}`);
    for (const m of errors) console.error(`  - ${m}`);
  }
  if (warnings.length) {
    console.error(`data.json: ${warnings.length} warning${warnings.length === 1 ? '' : 's'}`);
    for (const m of warnings) console.error(`  - ${m}`);
  }
  if (!errors.length && !warnings.length) {
    console.log(`data.json: ok (${data.records.length} records, ${data.tasks_supported.length} tasks, ${data.contributing_organizations.length} organizations)`);
  } else if (!errors.length) {
    console.log(`data.json: ok with ${warnings.length} warning${warnings.length === 1 ? '' : 's'} (${data.records.length} records)`);
  }
}
