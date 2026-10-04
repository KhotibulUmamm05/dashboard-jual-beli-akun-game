/* Inti dashboard: data, filter global, agregasi, format angka, komponen UI. */
const D = JSON.parse(document.getElementById("dash-data").textContent);
const S = D.S;
const PUB = D.mode === "public";
const GC = D.gcode;                       // ["FF","ML","RB"]
const GN = D.games;                       // nama lengkap
const GCOL = ["var(--s-ff)", "var(--s-ml)", "var(--s-rb)"];
const KCOL = ["var(--s-other)", "var(--s-violet)", "var(--s-magenta)"];
// kode mitra hanya ada di data versi internal
const MJ = D.mitra_code ? "mitra " + D.mitra_code : "mitra";
const KNAME = ["Langsung", "M" + MJ.slice(1) + " – dijualkan", "M" + MJ.slice(1) + " – dibeli mitra"];
const SEGCOL = ["var(--s-yellow)", "var(--s-violet)", "var(--s-magenta)", "var(--s-green)", "var(--s-other)"];
const OCOL = ["var(--o1)", "var(--o2)", "var(--o3)", "var(--o4)", "var(--o5)"];

const TRX = D.trx.map(r => ({ d: r[0], ym: Math.floor(r[0] / 100), g: r[1], r: r[2], m: r[3], k: r[4], s: r[5], a: r[6], fs: r[7], dts: r[8], b: r[9], band: r[10] }));
const STK = D.stock.map(r => ({ e: r[0], eym: r[0] > 0 ? Math.floor(r[0] / 100) : -1, g: r[1], st: r[2], m: r[3], j: r[4], s: r[5], fs: r[6], b: r[7], sd: r[8], sup: r[9] }));

// ---------- bulan ----------
const MONTHS = [];
for (let y = 2024, m = 9; y * 100 + m <= 202601; m++) { if (m > 12) { m = 1; y++; } MONTHS.push(y * 100 + m); }
const MN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const MNL = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const mi = ym => MONTHS.indexOf(ym);
const mLab = ym => MN[(ym % 100) - 1] + " " + String(Math.floor(ym / 100)).slice(2);
const mLong = ym => MNL[(ym % 100) - 1] + " " + Math.floor(ym / 100);
const QUARTERS = ["2025Q1", "2025Q2", "2025Q3", "2025Q4"];
const qOf = ym => Math.floor(ym / 100) + "Q" + (Math.floor(((ym % 100) - 1) / 3) + 1);

// ---------- format angka (id-ID) ----------
const NFC = {};
const nf = d => { d = typeof d === "number" ? d : 1; return NFC[d] || (NFC[d] = new Intl.NumberFormat("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d })); };
const NF0 = nf(0), NF1 = nf(1);
const num = v => NF0.format(Math.round(v));
const rp = v => (v < 0 ? "−" : "") + "Rp " + NF0.format(Math.round(Math.abs(v)));
function rpS(v, d = 1) {
  if (v === null || v === undefined || !isFinite(v)) return "—";
  d = typeof d === "number" ? d : 1;
  const a = Math.abs(v), sg = v < 0 ? "−" : "";
  const f = x => nf(d).format(x).replace(/,0+$/, "");
  if (a >= 1e9) return sg + "Rp " + f(a / 1e9) + " M";
  if (a >= 1e6) return sg + "Rp " + f(a / 1e6) + " jt";
  if (a >= 1e3) return sg + "Rp " + f(a / 1e3) + " rb";
  return sg + "Rp " + NF0.format(a);
}
function rpAx(v) {
  const a = Math.abs(v);
  if (a === 0) return "0";
  const f = x => (Number.isInteger(x) ? NF0.format(x) : NF1.format(x));
  if (a >= 1e6) return (v < 0 ? "−" : "") + f(+(a / 1e6).toFixed(1)) + " jt";
  if (a >= 1e3) return (v < 0 ? "−" : "") + f(+(a / 1e3).toFixed(1)) + " rb";
  return NF0.format(v);
}
const pct = (x, d = 1) => (x === null || x === undefined || !isFinite(x) ? "—" : nf(d).format(x * 100) + "%");
const spct = (x, d = 1) => (x === null || !isFinite(x) ? "—" : (x > 0 ? "+" : x < 0 ? "−" : "") + nf(d).format(Math.abs(x) * 100) + "%");
const spp = (x, d = 1) => (x === null || !isFinite(x) ? "—" : (x > 0 ? "+" : x < 0 ? "−" : "") + nf(d).format(Math.abs(x) * 100) + " pp");
const srp = v => (v > 0 ? "+" : v < 0 ? "−" : "") + rpS(Math.abs(v));
const dt = d => (d > 0 ? String(d % 100).padStart(2, "0") + "/" + String(Math.floor(d / 100) % 100).padStart(2, "0") + "/" + Math.floor(d / 10000) : "—");
const chg = (a, b) => (b ? a / b - 1 : null);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// ---------- state & filter ----------
const PRESETS = [
  { id: "q4", label: "Q4 2025 (Okt–Des)", r: [202510, 202512] },
  { id: "q3", label: "Q3 2025 (Jul–Sep)", r: [202507, 202509] },
  { id: "dec", label: "Desember 2025", r: [202512, 202512] },
  { id: "h2", label: "H2 2025 (Jul–Des)", r: [202507, 202512] },
  { id: "h1", label: "H1 2025 (Jan–Jun)", r: [202501, 202506] },
  { id: "y25", label: "Tahun 2025", r: [202501, 202512] },
  { id: "all", label: "Semua data (Sep 2024 – 9 Jan 2026)", r: [202409, 202601] },
  { id: "custom", label: "Kustom…", r: null },
];
const ST = { preset: "q4", from: 202510, to: 202512, games: [true, true, true], page: "ringkasan" };
const isDefault = () => ST.preset === "q4" && ST.games.every(Boolean);

function prevRange() {
  const n = mi(ST.to) - mi(ST.from) + 1;
  const pf = mi(ST.from) - n;
  if (pf < 0) return null;
  return [MONTHS[pf], MONTHS[mi(ST.from) - 1]];
}
const inR = (ym, r) => r && ym >= r[0] && ym <= r[1];
const gOn = g => ST.games[g];
const cur = (rows = TRX) => rows.filter(t => inR(t.ym, [ST.from, ST.to]) && gOn(t.g));
const prev = (rows = TRX) => { const p = prevRange(); return p ? rows.filter(t => inR(t.ym, p) && gOn(t.g)) : null; };
const rangeLabel = r => (r ? (r[0] === r[1] ? mLong(r[0]) : mLab(r[0]) + " – " + mLab(r[1])) : "—");
const gamesLabel = () => (ST.games.every(Boolean) ? "semua game" : GN.filter((_, i) => ST.games[i]).join(", "));
const activeGames = () => [0, 1, 2].filter(gOn);

function agg(rows) {
  if (!rows) return null;
  let trx = 0, rev = 0, gp = 0, revm = 0;
  for (const t of rows) { trx++; rev += t.r; if (t.m >= 0) { gp += t.r - t.m; revm += t.r; } }
  return { trx, rev, gp, revm, gpm: revm ? gp / revm : null, aov: trx ? rev / trx : null };
}
function byMonth(rows, keyFn, nKeys) {
  const out = MONTHS.map(() => Array(nKeys).fill(0));
  rows.forEach(t => { const i = mi(t.ym); if (i >= 0) out[i][keyFn(t)] += t.r; });
  return out;
}
function median(a) {
  if (!a.length) return null;
  const b = a.slice().sort((x, y) => x - y), h = Math.floor(b.length / 2);
  return b.length % 2 ? b[h] : (b[h - 1] + b[h]) / 2;
}
function quantile(a, q) {
  if (!a.length) return null;
  const b = a.slice().sort((x, y) => x - y);
  const p = (b.length - 1) * q, lo = Math.floor(p), hi = Math.ceil(p);
  return b[lo] + (b[hi] - b[lo]) * (p - lo);
}
function decompose(a, b) {
  // a = periode lalu, b = periode ini
  const A = agg(a), B = agg(b);
  if (!A || !A.trx || !B.trx) return null;
  return { vol: (B.trx - A.trx) * A.aov, aov: (B.aov - A.aov) * B.trx, d: B.rev - A.rev, A, B };
}

// ---------- komponen ----------
function h(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const k in attrs) {
    if (k === "class") n.className = attrs[k];
    else if (k === "html") n.innerHTML = attrs[k];
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), attrs[k]);
    else if (attrs[k] !== undefined && attrs[k] !== null && attrs[k] !== false) n.setAttribute(k, attrs[k]);
  }
  kids.flat().forEach(c => { if (c === null || c === undefined || c === false) return; n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
  return n;
}
const CONF = { High: 3, Medium: 2, Low: 1 };
function conf(level, extra) {
  const k = CONF[level] || 1;
  const dots = [1, 2, 3].map(i => `<span class="${i <= k ? "on" : ""}"></span>`).join("");
  return `<span class="conf" title="${extra ? esc(extra) : "Tingkat keyakinan"}"><i>${dots}</i>Confidence: ${level}</span>`;
}
const HYP = '<span class="tag hyp">Hipotesis</span>';
function sevTag(s) { return `<span class="tag ${s === "Tinggi" ? "sev-h" : s === "Sedang" ? "sev-m" : "sev-l"}">${s === "Tinggi" ? "▲ " : s === "Sedang" ? "■ " : "▽ "}${s}</span>`; }

function deltaEl(curv, prevv, type = "pct", goodUp = true) {
  if (curv === null || prevv === null || prevv === undefined || curv === undefined || !isFinite(curv) || !isFinite(prevv)) return h("span", { class: "delta flat" }, "tanpa pembanding");
  const d = type === "pp" ? curv - prevv : prevv ? curv / prevv - 1 : null;
  if (d === null) return h("span", { class: "delta flat" }, "—");
  const flat = Math.abs(d) < 0.005;
  const good = (d > 0) === goodUp;
  return h("span", { class: "delta " + (flat ? "flat" : good ? "up" : "down") }, (flat ? "■ " : d > 0 ? "▲ " : "▼ ") + (type === "pp" ? spp(d) : spct(d)));
}

function kpi(label, value, delta, meta, sparkEl) {
  return h("div", { class: "card kpi" }, h("div", { class: "lbl" }, label), h("div", { class: "val" }, value), delta || null, meta ? h("div", { class: "meta", html: meta }) : null, sparkEl || null);
}

// tabel sortable
function table(spec) {
  const wrap = h("div", { class: "tw" });
  let sortK = spec.sort ? spec.sort.k : null, desc = spec.sort ? spec.sort.desc !== false : true;
  const draw = () => {
    let rows = spec.rows.slice();
    if (sortK !== null) {
      const col = spec.cols.find(c => c.k === sortK);
      const val = col && col.sv ? col.sv : r => r[sortK];
      rows.sort((a, b) => {
        const x = val(a), y = val(b);
        if (x === y) return 0;
        if (x === null || x === undefined) return 1;
        if (y === null || y === undefined) return -1;
        return (x > y ? 1 : -1) * (desc ? -1 : 1);
      });
      rows = rows.filter(r => r._cls !== "grp").concat(rows.filter(r => r._cls === "grp"));
    }
    const t = h("table", { class: "t" + (spec.cls ? " " + spec.cls : "") });
    const tr = h("tr");
    spec.cols.forEach(c => {
      const th = h("th", { class: (c.num ? "num " : "") + (spec.nosort || c.nosort ? "" : "sortable"), scope: "col", "aria-sort": sortK === c.k ? (desc ? "descending" : "ascending") : null });
      th.appendChild(document.createTextNode(c.label));
      if (!(spec.nosort || c.nosort)) {
        th.appendChild(h("span", { class: "ar" }, sortK === c.k ? (desc ? "▼" : "▲") : "↕"));
        th.tabIndex = 0;
        const go = () => { if (sortK === c.k) desc = !desc; else { sortK = c.k; desc = !!c.num; } draw(); };
        th.addEventListener("click", go);
        th.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
      }
      tr.appendChild(th);
    });
    t.appendChild(h("thead", {}, tr));
    const tb = h("tbody");
    rows.forEach(r => {
      const row = h("tr", { class: r._cls || null });
      spec.cols.forEach(c => {
        const v = r[c.k];
        const td = h("td", { class: (c.num ? "num" : "") + (c.wrap ? " wrap" : "") + (c.cls ? " " + c.cls(r) : "") });
        if (c.html) td.innerHTML = c.html(r);
        else td.textContent = c.fmt ? c.fmt(v, r) : v === null || v === undefined ? "—" : v;
        row.appendChild(td);
      });
      tb.appendChild(row);
    });
    t.appendChild(tb);
    wrap.replaceChildren(t);
  };
  draw();
  return wrap;
}

// kartu grafik dengan tombol "Tabel"
const DRAWERS = [];
function chartCard(o) {
  const body = h("div", { class: "chart" });
  const tbl = h("div", { hidden: true });
  const head = h("div", { class: "card-head" }, h("div", {}, h("h3", {}, o.title), o.sub ? h("div", { class: "csub", html: o.sub }) : null));
  const right = h("div", { style: "display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end" });
  if (o.controls) right.appendChild(o.controls);
  if (o.table) {
    const b = h("button", { class: "tbtn", type: "button", "aria-expanded": "false" }, "Tabel");
    b.addEventListener("click", () => {
      const open = tbl.hidden;
      tbl.hidden = !open; body.hidden = open;
      if (o.legend) leg.hidden = open;
      b.textContent = open ? "Grafik" : "Tabel";
      b.setAttribute("aria-expanded", String(open));
      if (open) tbl.replaceChildren(table(typeof o.table === "function" ? o.table() : o.table));
      else draw();
    });
    right.appendChild(b);
  }
  head.appendChild(right);
  const leg = o.legend ? Charts.legend(o.legend, o.legendKind) : null;
  const card = h("div", { class: "card" + (o.cls ? " " + o.cls : "") }, head, leg, body, tbl, o.foot ? h("div", { class: "note", html: o.foot }) : null);
  const draw = () => { if (!body.hidden && body.isConnected) o.draw(body); };
  DRAWERS.push(draw);
  requestAnimationFrame(draw);
  card._redraw = draw;
  return card;
}

function insight(o) {
  // o: {t, e, i, c, kind, hyp}
  return h("div", { class: "ins " + (o.kind || ""), html:
    `<div class="t">${o.t}${o.hyp ? " " + HYP : ""} ${o.c ? conf(o.c, o.why) : ""}</div>` +
    (o.e ? `<div class="e"><span class="lbl-mini">Evidence</span>${o.e}</div>` : "") +
    (o.i ? `<div class="i"><span class="lbl-mini">Implikasi</span>${o.i}</div>` : "") });
}
function story(...items) { return h("div", { class: "card story" }, ...items.map(insight)); }

function pageHead(no, title, headline, lede) {
  const p = prevRange();
  const ctx = `Periode terpilih: <b>${rangeLabel([ST.from, ST.to])}</b> · pembanding: ${p ? rangeLabel(p) : "tidak tersedia"} · ${esc(gamesLabel())}. ` +
    (isDefault() ? "" : "Teks analisis ditulis untuk periode default (Q4 vs Q3 2025, semua game); angka di kartu, grafik, dan tabel mengikuti filter.");
  return h("div", {},
    h("div", { class: "eyebrow" }, `${no} · ${title}`),
    h("h1", { class: "headline", html: headline }),
    lede ? h("p", { class: "lede", html: lede }) : null,
    h("p", { class: "ctx", html: ctx }));
}
const sec = t => h("h2", { class: "sec" }, t);
const grid = (cls, ...kids) => h("div", { class: "grid " + cls }, ...kids);

// seri bulanan per game (revenue / transaksi / dll)
function monthlySeries(fn, rows = TRX) {
  return [0, 1, 2].map(g => MONTHS.map(ym => fn(rows.filter(t => t.g === g && t.ym === ym), ym, g)));
}
const bandIdx = () => [mi(ST.from), mi(ST.to)];
const FFD = (() => { const f = S.kanal.ff_direct, q = ["2025-10", "2025-11", "2025-12"].map(k => f[k]); return { sep: f["2025-09"], q4: Math.min(...q) + "–" + Math.max(...q) }; })();
const moveWord = (a, b) => { const c = b / a - 1; return Math.abs(c) < 0.05 ? "stabil" : c > 0 ? "justru naik" : "turun"; };
// Jan 2026 hanya 9 hari: garis tren berhenti di Des 2025 kecuali periode terpilih mencakup Jan 2026
const TM = () => (ST.to >= 202601 ? MONTHS : MONTHS.slice(0, mi(202512) + 1));
const cut = arr => arr.slice(0, TM().length);
const PARTIAL_NOTE = "Jan 2026 (baru 9 hari) hanya ditampilkan bila periode terpilih mencakupnya.";
