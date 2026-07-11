// Lithology Pattern Reference — generator (fully-vector PDF).
// One-time setup:  npm install pdfkit svg-to-pdfkit
// Run:            node tools/gen_pattern_reference.js
// Reads pattern/material data straight from diggs_file_inspector.html and writes
// lithology_pattern_reference.pdf. Patterns stay real SVG <pattern> vectors
// (no rasterization); render to check with: pdftoppm -png -r 150 <pdf> out
// Generate the Lithology Pattern Reference as a multi-page, fully-vector PDF.
// Builds one SVG per page (patterns kept as real <pattern> vectors) and renders
// them into a PDF with svg-to-pdfkit — no HTML, no screenshot, no rasterization.
const fs = require('fs');
const PDFDocument = require('pdfkit');
const SVGtoPDF = require('svg-to-pdfkit');

const path = require('path');
const APP = path.join(__dirname, '..', 'diggs_file_inspector.html');
const OUT = path.join(__dirname, '..', 'lithology_pattern_reference.pdf');
const html = fs.readFileSync(APP, 'utf8');
function objSrc(name) {
  const open = name.includes('KEYWORDS') ? '[' : '{';
  const close = name.includes('KEYWORDS') ? '];' : '};';
  const s = html.indexOf(`const ${name} = ${open}`);
  const e = html.indexOf(close, s) + close.length;
  return html.slice(s, e).replace(`const ${name} = `, '').replace(/;$/, '');
}
const LITH_MATERIALS   = eval('(' + objSrc('LITH_MATERIALS') + ')');
const USCS_SYMBOL_TO_MAT = eval('(' + objSrc('USCS_SYMBOL_TO_MAT') + ')');
const USCS_NAME_TO_MAT   = eval('(' + objSrc('USCS_NAME_TO_MAT') + ')');
const ROCK_KEYWORDS      = eval('(' + objSrc('ROCK_KEYWORDS') + ')');
const TILES = html.match(/const LITH_PATTERN_TILES = `([\s\S]*?)`;/)[1];

const D2487 = {
  GW:'Well-graded gravel', GP:'Poorly graded gravel', GM:'Silty gravel', GC:'Clayey gravel',
  'GW-GM':'Well-graded gravel with silt','GW-GC':'Well-graded gravel with clay','GP-GM':'Poorly graded gravel with silt','GP-GC':'Poorly graded gravel with clay','GC-GM':'Silty, clayey gravel',
  SW:'Well-graded sand', SP:'Poorly graded sand', SM:'Silty sand', SC:'Clayey sand',
  'SW-SM':'Well-graded sand with silt','SW-SC':'Well-graded sand with clay','SP-SM':'Poorly graded sand with silt','SP-SC':'Poorly graded sand with clay','SC-SM':'Silty, clayey sand',
  ML:'Silt', MH:'Elastic silt', CL:'Lean clay', CH:'Fat clay', 'CL-ML':'Silty clay',
  OL:'Organic silt/clay', OH:'Organic clay/silt', PT:'Peat',
};
const symbolsBy = {}, namesBy = {}, kwBy = {};
for (const [s, m] of Object.entries(USCS_SYMBOL_TO_MAT)) (symbolsBy[m] ||= []).push(s);
for (const [n, m] of Object.entries(USCS_NAME_TO_MAT)) (namesBy[m] ||= []).push(n);
for (const [re, m] of ROCK_KEYWORDS) (kwBy[m] ||= []).push(re.source);

const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const keys = Object.keys(LITH_MATERIALS);
const soilKeys = keys.filter(k => k.startsWith('soil-'));
const rockKeys = keys.filter(k => k.startsWith('rock-'));
const otherKeys = keys.filter(k => !k.startsWith('soil-') && !k.startsWith('rock-'));

// ── word wrap (approx, by average char width) ──
function wrap(str, maxChars) {
  const words = String(str).split(/\s+/), lines = []; let cur = '';
  for (const w of words) {
    if (!cur) cur = w;
    else if ((cur + ' ' + w).length <= maxChars) cur += ' ' + w;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

// ── page geometry ──
const PAGE_W = 1040, PAGE_H = 1500, MARGIN = 34;
const CONTENT_W = PAGE_W - 2 * MARGIN;
const GAP = 22, COL_W = (CONTENT_W - GAP) / 2;   // 497
const SWATCH_W = 150, SWATCH_H = 62, PAD = 8;
const TXT_X = SWATCH_W + 12;                       // text column start within card
const TXT_W = COL_W - TXT_X - PAD;                 // ~326px
const CH = 5.6;                                    // ~px per char for wrap sizing
const maxChars = Math.floor(TXT_W / CH);           // ~58
const LH = 12.5;                                   // line height

// Build a card model: content lines + computed height.
function buildCard(key) {
  const m = LITH_MATERIALS[key];
  const syms = symbolsBy[key] || [];
  const names = namesBy[key] || [];
  const kws = kwBy[key] || [];
  // rows: {label, valLines, mono?}
  const rows = [];
  rows.push({ label: 'USCS group(s)', valLines: syms.length ? syms.map(s => `${s} — ${D2487[s] || ''}`) : ['—'] });
  rows.push({ label: 'Class. names', valLines: wrap(names.length ? names.join(', ') : '—', maxChars) });
  rows.push({ label: 'Desc. keywords', valLines: kws.length ? wrap(kws.join('  '), maxChars) : ['—'], mono: true });
  const textH = PAD + 15 /*title*/ + 12 /*hex*/ + rows.reduce((a, r) => a + r.valLines.length * LH + 1, 0) + PAD;
  const h = Math.max(textH, SWATCH_H + 2 * PAD);
  return { key, m, rows, h };
}

function cardSVG(card, x, y) {
  const { key, m, rows, h } = card;
  let s = `<g>`;
  s += `<rect x="${x}" y="${y}" width="${COL_W}" height="${h}" rx="7" fill="#ffffff" stroke="#e2e6ea"/>`;
  // swatch (base + layers + border), left
  const sx = x, sy = y, sh = h;
  s += `<rect x="${sx}" y="${sy}" width="${SWATCH_W}" height="${sh}" fill="${m.color}"/>`;
  for (const lp of (m.layers || [`lithpat-${key}`]))
    s += `<rect x="${sx}" y="${sy}" width="${SWATCH_W}" height="${sh}" fill="url(#${lp})"/>`;
  s += `<rect x="${sx}" y="${sy}" width="${SWATCH_W}" height="${sh}" fill="none" stroke="#c9ced5"/>`;
  s += `<line x1="${x + SWATCH_W}" y1="${y}" x2="${x + SWATCH_W}" y2="${y + h}" stroke="#e2e6ea"/>`;
  // text
  let ty = y + PAD + 12;
  const tx = x + TXT_X;
  s += `<text x="${tx}" y="${ty}" font-family="Helvetica" font-size="13" font-weight="bold" fill="#1a1f26">${esc(m.label)} <tspan font-family="Courier" font-size="9.5" font-weight="normal" fill="#8a94a0">${esc(key)}</tspan></text>`;
  ty += 15;
  s += `<text x="${tx}" y="${ty}" font-family="Courier" font-size="10" fill="#666">${esc(m.color)}</text>`;
  ty += 12;
  for (const r of rows) {
    s += `<text x="${tx}" y="${ty}" font-family="Helvetica" font-size="8" fill="#8a94a0">${esc(r.label.toUpperCase())}</text>`;
    let vy = ty;
    for (const ln of r.valLines) {
      s += `<text x="${tx + 92}" y="${vy}" font-family="${r.mono ? 'Courier' : 'Helvetica'}" font-size="${r.mono ? 9 : 10.5}" fill="#333">${esc(ln)}</text>`;
      vy += LH;
    }
    ty = vy + 1;
  }
  s += `</g>`;
  return s;
}

// ── flow cards into pages (section headers are full-width, cards paired 2-up) ──
// NOTE: no stroke-width on .sk/.wk here — every .sk/.wk line/path in
// LITH_PATTERN_TILES sets its own via a stroke-width="…" attribute. svg-to-pdfkit
// resolves an embedded <style> class rule BEFORE a per-element override (the
// reverse of real CSS cascade order), so a class-level stroke-width here would
// silently win over every pattern's own weight (e.g. making lean/fat clay
// indistinguishable) — see the matching note in diggs_file_inspector.html's CSS.
const STYLE = '<style>' +
  '.sk{stroke:#141414;fill:none}.sf{fill:#141414;stroke:none}' +
  '.wk{stroke:#fff;fill:none}.wf{fill:#fff;stroke:none}' +
  '.lpk{stroke:#e6edf3;fill:none;stroke-width:1}.lpf{fill:#e6edf3;stroke:none}' +
  '</style>';

// Single continuous page sized to the content — avoids any fixed-page
// fit/scale mismatch in svg-to-pdfkit (no clipping, no trailing blank).
const page = [];          // all svg fragments
let y = MARGIN;
function ensure() {}       // no-op (no page breaks)

// header block (first page only)
function headerBlock() {
  const lead = 'Every fill pattern in the graphic lithology log, with the USCS groups, classification names and description keywords that route to it. Soil = 26 USCS (ASTM D2487) groups and rock patterns are recreated from FGDC tiles. Fully vector.';
  let s = `<text x="${MARGIN}" y="${y + 20}" font-family="Helvetica" font-size="19" font-weight="bold" fill="#1a1f26">DIGGS File Inspector — Lithology Pattern Reference</text>`;
  y += 34;
  const leadLines = wrap(lead, 150);
  for (const ln of leadLines) { s += `<text x="${MARGIN}" y="${y}" font-family="Helvetica" font-size="11" fill="#555">${esc(ln)}</text>`; y += 15; }
  // priority box
  y += 6;
  const prio = [
    'Resolution priority (first match wins): 1) USCS symbol  2) legend code  3) full/verbose USCS name  4) parenthetical symbol e.g. "FAT CLAY (CH)"  5) rock keyword  6) soil description parse  7) unknown.',
    'Soil parse: with "with", dominant = phrase before "with", fines qualifier after (clean gravel/sand + clay/silt -> borderline dual, e.g. "poorly graded gravel with clay" -> GP-GC); no "with" -> dominant = last noun ("gravelly sand" -> SP). "Desc. keywords" applies to rock only.',
  ];
  const pl = prio.flatMap(p => wrap(p, 168));
  const boxH = pl.length * 13 + 14;
  s += `<rect x="${MARGIN}" y="${y}" width="${CONTENT_W}" height="${boxH}" rx="6" fill="#f6f8fa" stroke="#e2e6ea"/>`;
  let py = y + 15;
  for (const ln of pl) { s += `<text x="${MARGIN + 10}" y="${py}" font-family="Helvetica" font-size="9.5" fill="#333">${esc(ln)}</text>`; py += 13; }
  y += boxH + 14;
  page.push(s);
}

function sectionHeader(title, sub) {
  ensure();
  y += 6;
  let s = `<text x="${MARGIN}" y="${y + 14}" font-family="Helvetica" font-size="14" font-weight="bold" fill="#1a1f26">${esc(title)} <tspan font-size="10.5" font-weight="normal" fill="#888">${esc(sub)}</tspan></text>`;
  s += `<line x1="${MARGIN}" y1="${y + 20}" x2="${MARGIN + CONTENT_W}" y2="${y + 20}" stroke="#e2e6ea" stroke-width="2"/>`;
  page.push(s);
  y += 30;
}

function addCardRow(cards) {   // 1 or 2 cards
  const rowH = Math.max(...cards.map(c => c.h));
  cards.forEach((c, i) => {
    const x = MARGIN + i * (COL_W + GAP);
    page.push(cardSVG(c, x, y));
  });
  y += rowH + 11;
}

function addSection(title, sub, ks) {
  sectionHeader(title, sub);
  const cards = ks.map(buildCard);
  for (let i = 0; i < cards.length; i += 2) addCardRow(cards.slice(i, i + 2));
}

headerBlock();
addSection('Soil', '26 USCS (ASTM D2487) groups — patterns recreated from FGDC tiles', soilKeys);
addSection('Rock', 'all recreated from FGDC tiles (phyllite/hornfels patterns hand-authored)', rockKeys);
addSection('Fallback', '', otherKeys);

// ── render as one continuous, content-sized vector page ──
const DOC_H = Math.ceil(y + MARGIN);
const doc = new PDFDocument({ size: [PAGE_W, DOC_H], margin: 0 });
const stream = fs.createWriteStream(OUT);
doc.pipe(stream);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE_W}" height="${DOC_H}" viewBox="0 0 ${PAGE_W} ${DOC_H}">` +
  STYLE + `<rect width="${PAGE_W}" height="${DOC_H}" fill="#ffffff"/>` +
  `<defs>${TILES}</defs>` + page.join('') + `</svg>`;
SVGtoPDF(doc, svg, 0, 0, { assumePt: true });
doc.end();
stream.on('finish', () => {
  const buf = fs.readFileSync(OUT);
  const imgs = (buf.toString('latin1').match(/\/Subtype\s*\/Image/g) || []).length;
  console.log(`page: ${PAGE_W}x${DOC_H} | materials: ${keys.length} | PDF bytes: ${buf.length} | raster images: ${imgs} (0 = vector)`);
});
