#!/usr/bin/env bash
set -euo pipefail

node scripts/validate-data.mjs

rm -rf dist
mkdir -p dist

cp datahub.html dist/
cp "Living Layers.html" dist/
cp data.json dist/
cp hero.jsx dist/
cp tweaks-panel.jsx dist/
cp _headers dist/
cp _redirects dist/
cp -r uploads dist/

echo "Built dist/ with $(ls dist | wc -l) entries"
