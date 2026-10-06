/* Halaman 7–12 dan inisialisasi */

/* ===================== 7. KONSENTRASI & RISIKO ===================== */
function pageRisiko(root) {
  const C = cur();
  root.append(pageHead(7, "Konsentrasi & Risiko",
    "Risiko terbesar bukan pada transaksi besar atau satu supplier, melainkan ketergantungan pada FF, dua admin, dan kanal mitra yang marginnya rendah.",
    "Seberapa besar dependency risk, dan risiko apa saja yang didukung data."));

  // kurva konsentrasi
  const xs = Array.from({ length: 21 }, (_, i) => i / 20);
  const curve = rs => {
    const v = rs.map(t => t.r).sort((a, b) => b - a), tot = v.reduce((a, b) => a + b, 0);
    const cum = [0]; v.forEach((x, i) => cum.push(cum[i] + x));
    return xs.map(p => (v.length ? cum[Math.round(p * v.length)] / tot : null));
  };
  const cser = activeGames().map(g => ({ name: GN[g], short: GC[g], color: GCOL[g], values: curve(C.filter(t => t.g === g)) }));
  cser.push({ name: "Merata sempurna", short: "Merata", color: "var(--axis)", values: xs, width: 1.5, noTip: false });
  const crow = g => {
    const rs = g === null ? C : C.filter(t => t.g === g);
    const v = rs.map(t => t.r).sort((a, b) => b - a), tot = v.reduce((a, b) => a + b, 0), n = v.length;
    if (!n) return null;
    const s = k => v.slice(0, k).reduce((a, b) => a + b, 0) / tot;
    let c = 0, k80 = 0; for (; k80 < n && c / tot < 0.8; k80++) c += v[k80];
    return { g: g === null ? "Total" : GN[g], n, t5: s(5), t10: s(10), t20: s(Math.ceil(n * 0.2)), n80: k80 / n, _cls: g === null ? "grp" : null };
  };
  const crows = activeGames().map(crow).concat([crow(null)]).filter(Boolean);
  root.append(grid("g2",
    chartCard({ title: "Kurva konsentrasi revenue", sub: "Transaksi diurutkan dari nilai terbesar. Makin melengkung ke kiri atas, makin terkonsentrasi.",
      legend: cser.map(x => ({ name: x.name, color: x.color, kind: "ln" })), legendKind: "ln",
      draw: el => Charts.line(el, { labels: xs, xFmt: v => pct(v, 0), series: cser, yFmt: v => pct(v, 0), tipFmt: v => pct(v), yMin: 0, yMax: 1, height: 260, dots: false, tipHeader: v => pct(v, 0) + " transaksi teratas", xEvery: 4 }),
      table: () => ({ cols: [{ k: "x", label: "% transaksi teratas", fmt: v => pct(v, 0) }, ...cser.slice(0, -1).map((x, i) => ({ k: "v" + i, label: x.name, num: true, fmt: v => pct(v) }))], rows: xs.map((x, j) => { const r = { x }; cser.slice(0, -1).forEach((s, i) => r["v" + i] = s.values[j]); return r; }), nosort: true }) }),
    h("div", { class: "card" }, h("h3", {}, "Konsentrasi transaksi (periode terpilih)"), h("div", { class: "csub" }, "Kontribusi revenue dari transaksi terbesar. Pareto 80/20 berarti 20% transaksi ≈ 80% revenue."),
      table({ cols: [{ k: "g", label: "Game" }, { k: "n", label: "Trx", num: true, fmt: num }, { k: "t5", label: "Top 5", num: true, fmt: v => pct(v) }, { k: "t10", label: "Top 10", num: true, fmt: v => pct(v) }, { k: "t20", label: "Top 20% trx", num: true, fmt: v => pct(v) }, { k: "n80", label: "% trx untuk 80% revenue", num: true, fmt: v => pct(v, 0) }], rows: crows, nosort: true }),
      h("div", { class: "note", html: `Sepanjang data, 20% transaksi teratas = ${pct(S.conc.ALL.top20p, 0)} revenue (jauh dari pola 80/20). ML paling terkonsentrasi: 10 transaksi teratas = ${pct(S.conc.ML.top10, 0)} revenue ML.` }))
  ));

  const dep = [
    ["Revenue dari Free Fire", S.conc.rev_share.FF], ["Laba kotor dari Free Fire", S.conc.gp_share.FF],
    ["Transaksi Q4 oleh 2 admin teratas", S.admin.top2_trx_q4], ["Revenue Q4 lewat kanal mitra", K.q4.mitra_share],
    ["Stok Ready yang berupa Roblox", S.ready.rb_share_n], ["Revenue dari 20% transaksi teratas", S.conc.ALL.top20p],
    ["Akun dari 10 penjual teratas", S.sup.top10], ["Revenue dari 10 transaksi teratas", S.conc.ALL.top10]];
  root.append(sec("Peta ketergantungan"), chartCard({ title: "Indikator ketergantungan", sub: "Angka statis sepanjang data/Q4 2025, tidak mengikuti filter.",
    draw: el => Charts.bar(el, { horizontal: true, labels: dep.map(d => d[0]), series: [{ name: "Porsi", color: "var(--o3)", values: dep.map(d => d[1]) }], percent: true, yFmt: v => pct(v, 0), labelFmt: v => pct(v, 0), labelWidth: 230, rowH: 30 }),
    table: { cols: [{ k: "a", label: "Indikator" }, { k: "b", label: "Porsi", num: true, fmt: v => pct(v) }], rows: dep.map(d => ({ a: d[0], b: d[1] })) } }));

  const R = [
    { r: "Margin kanal mitra jauh di bawah kanal langsung", e: `GPM mitra ${pct(K.q4.mitra_gpm)} vs langsung ${pct(K.q4.Langsung.gpm)}; porsi ${pct(K.q4.mitra_share)} revenue Q4; selisih ≈ ${rpS(K.gap_q4)}/kuartal.`, s: "Tinggi", c: "High", m: "Porsi & GPM kanal mitra (mingguan)" },
    { r: "Volume penjualan mendatar", e: `Transaksi Sep–Des ${H2M.join(" → ")}; pertumbuhan Q4 dari AOV.`, s: "Tinggi", c: "High", m: "Transaksi per hari (7 hari bergulir)" },
    { r: "Pasokan FF/ML tidak mengikuti permintaan " + HYP, e: `Sell-through FF ${pct(S.sellthrough.FF.min, 0)}–100%; FF Des masuk ${S.stockin.FF["2025-12"]} vs terjual ${S.dec.FF.trx}.`, s: "Tinggi", c: "Medium", m: "Rasio akun masuk : terjual per game" },
    { r: "Ketergantungan pada Free Fire", e: `${pct(S.conc.rev_share.FF, 0)} revenue dan ${pct(S.conc.gp_share.FF, 0)} laba kotor.`, s: "Sedang", c: "High", m: "Kontribusi revenue per game" },
    { r: "Ketergantungan pada dua admin, rotasi tinggi", e: `${pct(S.admin.top2_trx_q4, 0)} transaksi Q4; ${S.admin.n} nama admin dalam 6 bulan.`, s: "Sedang", c: "Medium", m: "Porsi transaksi admin teratas" },
    { r: "Stok Roblox lambat dan rawan usang", e: `${S.ready.RB.n} akun Ready, modal ${rpS(S.ready.RB.modal)}; ${S.ready.RB.gt90} akun > 90 hari; ${S.ready.RB.no_date} tanpa tanggal masuk.`, s: "Sedang", c: "High", m: "Umur stok Ready Roblox" },
    { r: "Jejak asal akun hilang (kontak penjual tidak dicatat) " + HYP, e: "0% akun masuk sejak Okt 2025 punya kontak penjual. Risiko: sulit menelusuri bila pemilik lama mengklaim kembali akun.", s: "Sedang", c: "Medium", m: "Kelengkapan kolom kontak penjual" },
    { r: "Pencatatan spreadsheet rawan salah baca", e: "1.331 tanggal tertukar format, satuan rupiah campur ribuan/penuh, 12 profit ditimpa manual.", s: "Sedang", c: "High", m: "Baris ber-flag per minggu" },
    { r: "Kebocoran operasional", e: `${S.loss.n} akun, modal ${rpS(S.loss.modal)} (${pct(S.loss.share_gp)} laba kotor).`, s: "Rendah", c: "High", m: "Modal tanpa pendapatan per bulan" },
    { r: "Perlambatan awal Januari 2026", e: `${NF1.format(S.jan_pace.jan)} vs ${NF1.format(S.jan_pace.dec)} transaksi/hari (Des).`, s: "Rendah", c: "Low", m: "Transaksi harian Januari penuh" }];
  root.append(sec("Register risiko"), h("div", { class: "card" }, h("div", { class: "csub" }, "Severity = besar dampak bila risiko terjadi. Confidence = kekuatan evidence."),
    table({ cols: [{ k: "r", label: "Risiko", html: r => r.r, wrap: true }, { k: "e", label: "Evidence", wrap: true }, { k: "s", label: "Severity", html: r => sevTag(r.s), sv: r => ({ Tinggi: 3, Sedang: 2, Rendah: 1 })[r.s] }, { k: "c", label: "Confidence", html: r => conf(r.c), sv: r => CONF[r.c] }, { k: "m", label: "Indikator dipantau", wrap: true }], rows: R })));
}

/* ===================== 8. PELUANG & SKENARIO ===================== */
function pagePeluang(root) {
  root.append(pageHead(8, "Peluang & Skenario",
    "Peluang yang didukung data: menambah pasokan akun yang cepat laku, mengikuti tren Roblox dengan batch kecil, dan menutup sebagian selisih margin kanal mitra.",
    "Potensi dihitung dengan aritmetika sederhana dari data Q4 2025, bukan prediksi."));
  const ff = Q4.FF, fi = S.rb.seg["Fish It"];
  root.append(grid("g2",
    story({ t: "1. Tambah pasokan FF/ML", hyp: true, c: "Medium", kind: "opp", why: "Bergantung pada asumsi permintaan belum terlayani",
      e: `Sell-through FF ${pct(S.sellthrough.FF.min, 0)}–100%, median laku ${S.dts.FF.med} hari; ${pct(S.dts.FF.le7, 0)} akun FF laku ≤ 7 hari. Stok Ready FF hanya ${S.ready.FF.n} akun.`,
      i: `Setiap +10 akun FF terjual per bulan ≈ <b>+${rpS(10 * ff.aov)}</b> revenue dan <b>+${rpS(10 * ff.aov * ff.gpm)}</b> laba kotor per bulan (AOV & GPM FF Q4). Validasi: catat permintaan yang tidak terlayani.` }),
    story({ t: "2. Perbaiki margin kanal mitra", hyp: true, c: "Medium", kind: "opp", why: "Respons mitra terhadap harga belum diketahui",
      e: `Q4: revenue mitra ${rpS(K.q4["Mitra - dijualkan"].rev + K.q4["Mitra - dibeli mitra"].rev)}, GPM ${pct(K.q4.mitra_gpm)} vs ${pct(K.q4.Langsung.gpm)} di kanal langsung.`,
      i: `Menutup separuh selisih margin ≈ <b>+${rpS(K.gap_q4 / 2)}</b> laba kotor per kuartal, dengan asumsi volume mitra tidak berubah.` }),
    story({ t: "3. Ikuti tren Roblox dengan batch kecil", c: "Medium", kind: "opp",
      e: `Fish It: median laku ${fi.dts} hari, AOV ${rpS(fi.aov)}, GPM ${pct(fi.gpm)}; ${S.rb.fishit_dec} transaksi di Desember. Batch besar Juli butuh median ${S.rb.batch_dts} hari untuk laku dan ${S.rb.batch_ready} akun masih tersisa.`,
      i: "Beli dalam jumlah kecil tetapi sering, sesuai subkategori yang sedang naik, dan hentikan pembelian segmen yang mulai melambat." }),
    story({ t: "4. Cairkan stok Ready", c: "High", kind: "opp",
      e: `${num(S.ready.n)} akun Ready bernilai daftar ${rpS(S.ready.list)} (modal ${rpS(S.ready.modal)}). Roblox: ${S.ready.RB.gt90} akun > 90 hari dan ${S.ready.RB.no_date} tanpa tanggal masuk.`,
      i: "Diskon terarah untuk stok > 90 hari atau penyaluran lewat mitra mengembalikan modal kerja untuk membeli akun yang lebih cepat laku." }),
    story({ t: "5. Pertahankan momentum ML massal", c: "High", kind: "opp",
      e: `ML Q4 ${num(Q4.ML.trx)} transaksi (${spct(chg(Q4.ML.trx, Q3.ML.trx), 0)} vs Q3), GPM ${pct(Q4.ML.gpm)}, median laku ${S.dts.ML.med} hari.`,
      i: "ML kini punya profil yang mirip FF: cepat laku dan marginnya sehat. Pasokan ML layak ditambah bertahap." })
  ));

  // simulator
  const base = { trx: Q4.trx / 3, aov: Q4.aov, ms: K.q4.mitra_share, gd: K.q4.Langsung.gpm, gm: K.q4.mitra_gpm };
  const h2max = Math.max(...[202507, 202508, 202509, 202510, 202511, 202512].map(mtrx));
  const SC = {
    Base: { dv: 0, da: 0, ms: base.ms, gm: base.gm, note: `Rata-rata bulanan Q4 2025 bertahan: ${num(base.trx)} transaksi, AOV ${rpS(base.aov)}, porsi mitra ${pct(base.ms)}, GPM mitra ${pct(base.gm)}, GPM langsung ${pct(base.gd)}.` },
    Upside: { dv: h2max / base.trx - 1, da: S.dec.aov / base.aov - 1, ms: base.ms, gm: 0.5, note: `Volume kembali ke bulan terbaik H2 (${h2max} transaksi), AOV bertahan di level Desember (${rpS(S.dec.aov)}), GPM mitra naik ke 50%.` },
    Downside: { dv: (S.jan_pace.jan * 30.4) / base.trx - 1, da: 0, ms: base.ms, gm: base.gm, note: `Laju 1–9 Januari 2026 berlanjut (${NF1.format(S.jan_pace.jan)} transaksi/hari ≈ ${num(S.jan_pace.jan * 30.4)}/bulan), AOV rata-rata Q4.` } };
  const calc = p => { const trx = base.trx * (1 + p.dv), rev = trx * base.aov * (1 + p.da), gp = rev * ((1 - p.ms) * base.gd + p.ms * p.gm); return { trx, rev, gp, gpm: gp / rev }; };
  const B0 = calc(SC.Base);
  const st = Object.assign({}, SC.Base);
  const out = h("div", { class: "grid g-kpi" });
  const mkS = (lab, key, min, max, stp, fmt) => {
    const lv = h("b", {}, fmt(st[key]));
    const inp = h("input", { type: "range", min, max, step: stp, value: st[key], "aria-label": lab });
    inp.addEventListener("input", () => { st[key] = +inp.value; lv.textContent = fmt(st[key]); render(); });
    return { el: h("div", {}, h("label", {}, lab, lv), inp), inp, lv, key, fmt };
  };
  const sliders = [mkS("Perubahan volume", "dv", -0.6, 0.4, 0.01, v => spct(v, 0)), mkS("Perubahan AOV", "da", -0.3, 0.3, 0.01, v => spct(v, 0)), mkS("Porsi revenue kanal mitra", "ms", 0, 0.6, 0.01, v => pct(v, 0)), mkS("GPM kanal mitra", "gm", 0.2, 0.65, 0.005, v => pct(v, 1))];
  const render = () => {
    const r = calc(st);
    out.replaceChildren(
      kpi("Transaksi / bulan", num(r.trx), deltaEl(r.trx, B0.trx)), kpi("Revenue / bulan", rpS(r.rev), deltaEl(r.rev, B0.rev)),
      kpi("Laba kotor / bulan", rpS(r.gp), deltaEl(r.gp, B0.gp)), kpi("GPM", pct(r.gpm), deltaEl(r.gpm, B0.gpm, "pp")));
  };
  const presetBtns = h("div", { class: "seg" });
  Object.keys(SC).forEach(k => {
    const b = h("button", { type: "button", "aria-pressed": String(k === "Base") }, k);
    b.addEventListener("click", () => { Object.assign(st, SC[k]); sliders.forEach(s => { s.inp.value = st[s.key]; s.lv.textContent = s.fmt(st[s.key]); }); presetBtns.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); render(); });
    presetBtns.appendChild(b);
  });
  render();
  const scRows = Object.entries(SC).map(([k, p]) => { const r = calc(p); return { k, a: p.note, trx: r.trx, rev: r.rev, gp: r.gp, gpm: r.gpm, d: r.gp - B0.gp }; });
  root.append(sec("Skenario Base / Upside / Downside"),
    h("div", { class: "card" }, h("div", { class: "card-head" }, h("div", {}, h("h3", {}, "Simulator skenario bulanan"), h("div", { class: "csub" }, "Revenue = transaksi × AOV. Laba kotor = revenue × [(1 − porsi mitra) × GPM langsung + porsi mitra × GPM mitra]. GPM langsung dikunci di level Q4.")), presetBtns),
      h("div", { class: "sim" }, h("div", { class: "ctrl" }, ...sliders.map(s => s.el)), out),
      h("div", { class: "note" }, "Laba kotor Base sedikit di atas aktual Q4 karena GPM diterapkan ke seluruh revenue, termasuk 1,6% transaksi yang modalnya tidak tercatat.")),
    h("div", { class: "card", style: "margin-top:16px" }, h("h3", {}, "Asumsi eksplisit tiap skenario"), h("div", { class: "csub" }, "Ilustrasi, bukan prediksi. Data belum cukup untuk memodelkan musiman atau elastisitas harga."),
      table({ nosort: true, cols: [{ k: "k", label: "Skenario" }, { k: "a", label: "Asumsi", wrap: true }, { k: "trx", label: "Trx/bln", num: true, fmt: num }, { k: "rev", label: "Revenue/bln", num: true, fmt: rpS }, { k: "gp", label: "Laba kotor/bln", num: true, fmt: rpS }, { k: "gpm", label: "GPM", num: true, fmt: v => pct(v) }, { k: "d", label: "Δ laba vs Base", num: true, fmt: srp }], rows: scRows })));
}

/* ===================== 9. PERBANDINGAN & KEPUTUSAN ===================== */
function pageKeputusan(root) {
  root.append(pageHead(9, "Perbandingan & Decision Support",
    "Lima keputusan yang didukung data. Setiap isu punya minimal dua opsi; opsi yang bertumpu pada hipotesis diberi label dan disertai data yang dibutuhkan untuk validasi.",
    "Dashboard mendukung keputusan, bukan menggantikan judgement manajemen."));
  const sg = S.rb.seg;
  const cmp = [
    { d: "Periode", p: "Des vs Nov 2025 (revenue)", a: rpS(S.nov.rev), b: rpS(S.dec.rev), x: spct(chg(S.dec.rev, S.nov.rev)), n: "Didorong AOV; satu Desember saja" },
    { d: "Periode", p: "Q4 vs Q3 2025 (revenue)", a: rpS(Q3.rev), b: rpS(Q4.rev), x: spct(chg(Q4.rev, Q3.rev)), n: "Volume +4%, AOV +15%" },
    { d: "Periode", p: "H2 vs H1 2025 (revenue)", a: rpS(S.h1.rev), b: rpS(S.h2.rev), x: spct(chg(S.h2.rev, S.h1.rev), 0), n: "Didorong volume" },
    { d: "Game (Q4)", p: "GPM FF vs ML vs Roblox", a: `${pct(Q4.FF.gpm)} · ${pct(Q4.ML.gpm)}`, b: pct(Q4.RB.gpm), x: "Roblox tertinggi", n: "Roblox paling lambat laku" },
    { d: "Game", p: "Median hari laku FF vs ML vs Roblox", a: `${S.dts.FF.med} · ${S.dts.ML.med} hari`, b: `${S.dts.RB.med} hari`, x: `${NF1.format(S.dts.RB.med / S.dts.FF.med)}×`, n: "Sepanjang data" },
    { d: "Segmen Roblox", p: "Fish It vs On Mic vs Avatar (AOV)", a: `${rpS(sg["Fish It"].aov)} · ${rpS(sg["On Mic / Voice"].aov)}`, b: rpS(sg.Avatar.aov), x: "Fish It tertinggi", n: `Laku median ${NF1.format(sg["Fish It"].dts)} · ${NF1.format(sg["On Mic / Voice"].dts)} · ${NF1.format(sg.Avatar.dts)} hari` },
    { d: "Kanal (Q4)", p: "GPM langsung vs mitra", a: pct(K.q4.Langsung.gpm), b: pct(K.q4.mitra_gpm), x: spp(K.q4.mitra_gpm - K.q4.Langsung.gpm), n: `Porsi mitra ${pct(K.q4.mitra_share)}` },
    { d: "Kelas harga", p: "GPM Murah vs Premium", a: pct(S.bands[0].gpm), b: pct(S.bands[4].gpm), x: spp(S.bands[4].gpm - S.bands[0].gpm), n: `Premium laku median ${S.bands[4].dts} hari` },
    { d: "Aktual vs target", p: "—", a: "—", b: "—", x: "—", n: "Target/budget tidak tersedia di data" }];
  root.append(sec("Ringkasan perbandingan kunci"), h("div", { class: "card" }, table({ nosort: true, cols: [{ k: "d", label: "Dimensi" }, { k: "p", label: "Perbandingan" }, { k: "a", label: "A" }, { k: "b", label: "B" }, { k: "x", label: "Selisih" }, { k: "n", label: "Catatan", wrap: true }], rows: cmp })));

  const gap = rpS(K.gap_q4), gap2 = rpS(K.gap_q4 / 2);
  const ffAov = Q4.FF.aov, ffG = Q4.FF.gpm;
  const O = [
    { grp: `Kanal ${MJ}: porsi ${pct(K.q4.mitra_share)} revenue Q4, margin rendah`, ev: `GPM mitra ${pct(K.q4.mitra_gpm)} vs langsung ${pct(K.q4.Langsung.gpm)}; selisih ≈ ${gap}/kuartal. Penjualan langsung FF turun ${FFD.sep} → ${FFD.q4}/bln saat mitra naik.`, c: "High (angka) · Low (kanibalisasi)", opts: [
      { o: "A1. Tetapkan batas margin minimum untuk transaksi mitra", plus: "Langsung mengamankan laba per akun; mudah diterapkan", risk: "Mitra bisa mengurangi volume", imp: `Hingga +${gap2}/kuartal bila separuh selisih tertutup dan volume tetap`, kpi: "GPM & porsi kanal mitra" },
      { o: "A2. Arahkan kanal mitra hanya ke stok lambat (> 60 hari, FS)", plus: "Mitra jadi alat likuidasi, bukan pesaing kanal langsung", risk: "Pendapatan mitra turun; hubungan mitra perlu dijaga", imp: "Mempercepat perputaran stok Roblox; dampak laba bergantung pada kanibalisasi " + HYP, kpi: "Umur stok, porsi mitra" },
      { o: "A3. Pertahankan, lalu ukur apakah penjualan mitra benar-benar tambahan", plus: "Tidak mengganggu volume", risk: "Selisih margin terus berjalan", imp: "Netral; butuh data asal pembeli (kanal/akun pembeli) untuk validasi", kpi: "Penjualan langsung per bulan" }] },
    { grp: "Volume mendatar; FF/ML hampir selalu habis", ev: `Transaksi Sep–Des ${H2M.join(" → ")}; sell-through FF ${pct(S.sellthrough.FF.min, 0)}–100%, median laku 3 hari; FF Des masuk ${S.stockin.FF["2025-12"]} vs terjual ${S.dec.FF.trx}.`, c: "Medium", opts: [
      { o: "B1. Perbesar sourcing FF/ML: stok masuk ≥ penjualan bulan sebelumnya " + HYP, plus: "Tuas pertumbuhan paling langsung bila permintaan ada", risk: "Bila permintaan ternyata terbatas, stok menumpuk", imp: `+10 akun FF/bln ≈ +${rpS(10 * ffAov)} revenue, +${rpS(10 * ffAov * ffG)} laba kotor`, kpi: "Rasio masuk:terjual, permintaan tak terlayani" },
      { o: "B2. Dorong AOV lewat kelas Menengah–Menengah atas", plus: "Tidak butuh pasokan tambahan", risk: "Kelas Premium bermargin lebih tipis dan lambat laku", imp: `AOV +10% ≈ +${rpS(Q4.rev / 3 * 0.1)} revenue/bln`, kpi: "AOV, GPM per kelas harga" },
      { o: "B3. Kombinasi bertahap: uji B1 di FF selama 4–6 minggu sambil menjaga AOV", plus: "Risiko terkontrol, hasil terukur", risk: "Butuh pencatatan permintaan yang disiplin", imp: "Bukti untuk keputusan pasokan berikutnya", kpi: "Transaksi FF per minggu" }] },
    { grp: "Stok Roblox lambat, modal tertahan", ev: `${S.ready.RB.n} akun Ready (modal ${rpS(S.ready.RB.modal)}), ${S.ready.RB.gt90} > 90 hari, ${S.ready.rb_onmic} On Mic; median laku Roblox ${S.dts.RB.med} hari.`, c: "High", opts: [
      { o: "C1. Obral stok > 90 hari dan sisa batch Juli", plus: "Modal kembali untuk stok yang cepat laku", risk: "Margin per akun turun", imp: `Modal Roblox yang bisa dicairkan s.d. ${rpS(S.ready.RB.modal)}`, kpi: "Umur stok Roblox" },
      { o: "C2. Ubah pola beli: batch kecil & sering, mengikuti subkategori yang sedang naik", plus: `Sesuai data: Fish It laku ${S.rb.seg["Fish It"].dts} hari vs batch besar ${S.rb.batch_dts} hari`, risk: "Butuh pemantauan tren mingguan", imp: "Menurunkan risiko stok usang", kpi: "Median hari laku per subkategori" },
      { o: "C3. Tahan pembelian Roblox sampai stok Ready < 60 akun", plus: "Paling hemat modal", risk: "Kehilangan momentum tren (mis. Fish It)", imp: "Revenue Roblox bisa turun sementara", kpi: "Stok Ready & transaksi Roblox" }] },
    { grp: "Ketergantungan pada dua admin, rotasi tinggi", ev: `${pct(S.admin.top2_trx_q4, 0)} transaksi Q4 oleh dua admin; ${S.admin.n} nama admin dalam 6 bulan.`, c: "Medium", opts: [
      { o: "D1. SOP penjualan tertulis + cross-training", plus: "Kapasitas tidak bergantung pada individu", risk: "Butuh waktu pelatihan", imp: "Mengurangi risiko gangguan penjualan", kpi: "Porsi transaksi admin teratas" },
      { o: "D2. Jadwal dan pembagian beban kerja per game", plus: "Beban lebih merata, mudah dipantau", risk: "Koordinasi tambahan", imp: "Stabilitas layanan", kpi: "Transaksi per admin per minggu" }] },
    { grp: "Disiplin pencatatan melemah", ev: `Kontak penjual 0% sejak Okt 2025; ${S.loss.n} akun hilang tanpa alasan jelas; 1.331 tanggal tertukar format; 12 profit ditimpa.`, c: "High", opts: [
      { o: "E1. Validasi input di Google Sheets (format tanggal, satuan rupiah, kolom wajib, rumus profit terkunci)", plus: "Biaya hampir nol; mencegah salah baca angka", risk: "Admin perlu adaptasi", imp: "Analisis bulanan bisa otomatis tanpa pembersihan manual", kpi: "Baris ber-flag per minggu" },
      { o: "E2. Wajibkan kontak penjual dan alasan saat akun keluar tanpa penjualan", plus: "Jejak asal akun & kontrol kebocoran", risk: "Menambah langkah input", imp: `Menutup celah kebocoran ${rpS(S.loss.modal)} dan risiko sengketa akun`, kpi: "Kelengkapan kolom, modal tanpa pendapatan" }] }];
  root.append(sec("Tabel opsi keputusan"), h("p", { class: "ctx" }, "Satu kartu per isu. Estimasi dampak adalah aritmetika dari data Q4 2025 dengan asumsi yang disebutkan, bukan prediksi."));
  O.forEach((g, n) => {
    const c = g.c.split(" ")[0];
    root.append(h("div", { class: "card dec-card" },
      h("div", { class: "dec-head", html: `<div><span class="lbl-mini">Isu / temuan ${n + 1}</span><b>${g.grp}</b></div><div><span class="lbl-mini">Evidence (angka)</span><p>${g.ev}</p></div><div><span class="lbl-mini">Confidence</span>${conf(c)}${g.c.includes("·") ? `<p style="font-size:12px;margin-top:4px">${g.c}</p>` : ""}</div>` }),
      table({ nosort: true, cols: [{ k: "o", label: "Opsi keputusan", html: r => r.o, wrap: true }, { k: "plus", label: "Kelebihan", wrap: true }, { k: "risk", label: "Risiko", wrap: true }, { k: "imp", label: "Estimasi dampak", html: r => r.imp, wrap: true }, { k: "kpi", label: "KPI untuk dimonitor", wrap: true }], rows: g.opts })));
  });
}

/* ===================== 10. REGISTER INSIGHT & MONITORING ===================== */
function pageRegister(root) {
  root.append(pageHead(10, "Insight Register & Monitoring",
    "Sebelas insight material, diurutkan berdasarkan prioritas, dan dua belas KPI yang perlu dipantau beserta ambang batasnya.",
    "Prioritas = gabungan dampak bisnis, kekuatan evidence, urgensi, dan kemudahan ditindaklanjuti."));
  const I = [
    [1, "Kanal mitra 25,6% revenue Q4 dengan GPM 40% vs 65%", `GPM mitra ${pct(K.q4.mitra_gpm)} vs ${pct(K.q4.Langsung.gpm)}; selisih ≈ ${rpS(K.gap_q4)}/kuartal`, "Tinggi", "Tinggi", "Tinggi", "High (angka) / Low (kanibalisasi)"],
    [2, "Volume mendatar, pertumbuhan dari AOV", `Efek AOV ${srp(S.dec_q4q3.ALL.aov)} vs volume ${srp(S.dec_q4q3.ALL.vol)}`, "Tinggi", "Tinggi", "Sedang", "High"],
    [3, "FF/ML habis terjual; volume kemungkinan dibatasi pasokan (Hipotesis)", `Sell-through FF ${pct(S.sellthrough.FF.min, 0)}–100%, median 3 hari`, "Tinggi", "Tinggi", "Tinggi", "Medium"],
    [4, "Stok Roblox lambat, modal tertahan", `${S.ready.RB.n} akun, ${rpS(S.ready.RB.modal)}; median laku ${S.dts.RB.med} hari`, "Sedang", "Sedang", "Tinggi", "High"],
    [5, "Turunnya Roblox Q4 karena batch Juli habis", `Di luar batch: ${rpS(S.rb.ex_rev_q3)} → ${rpS(S.rb.ex_rev_q4)}`, "Sedang", "Sedang", "Tinggi", "Medium"],
    [6, "Ketergantungan pada FF dan dua admin", `FF ${pct(S.conc.rev_share.FF, 0)} revenue; 2 admin ${pct(S.admin.top2_trx_q4, 0)} trx Q4`, "Sedang", "Sedang", "Sedang", "Medium"],
    [7, "ML bergeser ke akun massal bermargin sehat", `AOV ${rpS(S.ml.aov_h1)} → ${rpS(S.ml.aov_h2)}; GPM ${pct(S.ml.gpm_h1, 0)} → ${pct(S.ml.gpm_h2, 0)}`, "Sedang", "Rendah", "Sedang", "High"],
    [8, "Kebocoran kecil, pencatatan melemah", `${S.loss.n} akun, ${rpS(S.loss.modal)}; kontak penjual 0% sejak Okt`, "Rendah (nilai), Tinggi (kontrol)", "Sedang", "Tinggi", "High"],
    [9, "Kelas Premium bermargin tipis & lambat; FS lambat", `GPM Premium ${pct(S.bands[4].gpm)} vs Murah ${pct(S.bands[0].gpm)}`, "Sedang", "Rendah", "Sedang", "Medium"],
    [10, "Konsentrasi transaksi & supplier rendah (positif)", `20% trx teratas = ${pct(S.conc.ALL.top20p, 0)} revenue; 10 penjual = ${pct(S.sup.top10)} stok`, "Positif", "Rendah", "Rendah", "High"],
    [11, "Perlambatan awal Januari 2026", `${NF1.format(S.jan_pace.jan)} vs ${NF1.format(S.jan_pace.dec)} trx/hari`, "Belum jelas", "Pantau", "—", "Low"]];
  const rank = { Tinggi: 3, Sedang: 2, Rendah: 1, Positif: 0, Pantau: 1, "Belum jelas": 0 };
  root.append(sec("Insight register"), h("div", { class: "card" }, table({ sort: { k: "p", desc: false },
    cols: [{ k: "p", label: "Prioritas", num: true }, { k: "t", label: "Insight", wrap: true }, { k: "e", label: "Evidence", wrap: true }, { k: "bi", label: "Business impact", sv: r => rank[r.bi.split(" ")[0]] ?? 0 }, { k: "u", label: "Urgensi", sv: r => rank[r.u] ?? 0 }, { k: "a", label: "Actionability", sv: r => rank[r.a] ?? 0 }, { k: "c", label: "Confidence" }],
    rows: I.map(x => ({ p: x[0], t: x[1], e: x[2], bi: x[3], u: x[4], a: x[5], c: x[6] })) })));

  const q4m = Q4.rev / 3, sd = S.h2_monthly_sd.rev;
  const M = [
    ["Transaksi per hari (rata-rata 7 hari)", "Leading", "Harian", "< 5,0 transaksi/hari", `Q4: ${NF1.format(Q4.trx / 92)}/hari`, "Sinyal paling cepat untuk perlambatan volume"],
    ["Rasio akun masuk : terjual (FF, ML)", "Leading", "Mingguan", "< 1,0 dua minggu berturut-turut", `FF Des: ${S.stockin.FF["2025-12"]} : ${S.dec.FF.trx}`, "Menguji hipotesis pasokan"],
    ["Porsi revenue kanal mitra", "Leading", "Mingguan", "> 30%", `Q4: ${pct(K.q4.mitra_share)}`, "Margin total tergerus bila porsi naik"],
    ["GPM kanal mitra", "Lagging", "Bulanan", "< 40%", `Q4: ${pct(K.q4.mitra_gpm)}`, "Batas bawah margin kanal"],
    ["GPM total", "Lagging", "Bulanan", "< 55%", `Q4: ${pct(Q4.gpm)}`, "Kesehatan harga dan bauran"],
    ["AOV", "Lagging", "Bulanan", "Turun > 10% MoM", `Des: ${rpS(S.dec.aov)}`, "Pertumbuhan Q4 bertumpu pada AOV"],
    ["Revenue bulanan", "Lagging", "Bulanan", `< ${rpS(q4m - sd)} (rata-rata Q4 − 1 SD)`, `Q4: ${rpS(q4m)}/bln`, "Deteksi penurunan material"],
    ["Stok Ready Roblox > 90 hari", "Leading", "Mingguan", "> 20 akun", `${S.ready.RB.gt90} akun (+${S.ready.RB.no_date} tanpa tanggal)`, "Risiko stok usang"],
    ["Median hari laku Roblox", "Leading", "Bulanan", "> 14 hari", `${S.dts.RB.med} hari`, "Kecepatan perputaran"],
    ["Modal tanpa pendapatan", "Lagging", "Bulanan", "> 0,5% laba kotor bulan itu", `kumulatif ${pct(S.loss.share_gp, 2)}`, "Kontrol kebocoran"],
    ["Kelengkapan data (kontak penjual, tanggal masuk)", "Leading", "Mingguan", "< 95% baris lengkap", "Kontak penjual 0% sejak Okt 2025", "Traceability"],
    ["Porsi transaksi dua admin teratas", "Lagging", "Bulanan", "> 80%", `Q4: ${pct(S.admin.top2_trx_q4, 0)}`, "Risiko ketergantungan SDM"]];
  root.append(sec("KPI yang direkomendasikan untuk monitoring"), h("div", { class: "card" }, h("div", { class: "csub" }, "Leading = memberi sinyal lebih awal; lagging = mengonfirmasi hasil. Ambang batas diturunkan dari data Q4 2025."),
    table({ cols: [{ k: "k", label: "KPI", wrap: true }, { k: "j", label: "Jenis" }, { k: "f", label: "Frekuensi" }, { k: "t", label: "Ambang batas" }, { k: "v", label: "Nilai acuan" }, { k: "w", label: "Alasan", wrap: true }], rows: M.map(x => ({ k: x[0], j: x[1], f: x[2], t: x[3], v: x[4], w: x[5] })) })));
}

/* ===================== 11. TANYA-JAWAB EKSEKUTIF ===================== */
function pageQA(root) {
  root.append(pageHead(11, "Executive Q&A", "Pertanyaan yang kemungkinan diajukan CEO dan investor, dengan jawaban berbasis data dan tingkat keyakinannya.", null));
  const fi = S.rb.seg["Fish It"];
  const QA = [
    ["Apakah bisnis ini tumbuh?", `Ya. Revenue H2 2025 ${rpS(S.h2.rev)} vs H1 ${rpS(S.h1.rev)} (${spct(chg(S.h2.rev, S.h1.rev), 0)}), Q4 ${spct(chg(Q4.rev, Q3.rev))} dari Q3. Namun volume mendatar sejak September.`, "High"],
    ["Apakah bisnis ini menguntungkan?", `Pada level laba kotor, ya: GPM ${pct(S.all.gpm)} sepanjang data dan ${pct(Q4.gpm)} di Q4. Laba bersih tidak bisa dihitung karena biaya operasional (iklan, gaji, fee) tidak tercatat.`, "High"],
    ["Dari mana pertumbuhan Q4?", `Dari AOV: efek AOV ${srp(S.dec_q4q3.ALL.aov)}, efek volume ${srp(S.dec_q4q3.ALL.vol)}. Transaksi hanya naik ${pct(chg(Q4.trx, Q3.trx))}.`, "High"],
    ["Kenapa GPM Q4 turun?", `Karena kanal ${MJ} (${pct(K.q4.mitra_share)} revenue Q4) ber-GPM ${pct(K.q4.mitra_gpm)}. GPM kanal langsung justru naik dari ${pct(K.q3.Langsung.gpm)} ke ${pct(K.q4.Langsung.gpm)}.`, "High"],
    ["Apakah kanal mitra mengambil penjualan langsung?", `Belum bisa dipastikan. Penjualan langsung FF turun dari ${FFD.sep} (Sep) ke ${FFD.q4}/bulan saat kanal mitra naik, tetapi data asal pembeli tidak ada. Ini hipotesis.`, "Low"],
    ["Game mana yang paling penting?", `Free Fire: ${pct(S.conc.rev_share.FF, 0)} revenue dan ${pct(S.conc.gp_share.FF, 0)} laba kotor, laku median ${S.dts.FF.med} hari.`, "High"],
    ["Game mana yang paling menguntungkan per rupiah?", `Roblox, GPM Q4 ${pct(Q4.RB.gpm)}, tetapi paling lambat laku (median ${S.dts.RB.med} hari) dan paling banyak stok tertahan.`, "High"],
    ["Kenapa Roblox turun di Q4?", `Stok borongan Juli (${S.rb.batch_n} akun) sudah hampir habis: revenue dari batch ini ${rpS(S.rb.batch_rev_q3)} di Q3 dan ${rpS(S.rb.batch_rev_q4)} di Q4. Di luar batch, revenue Roblox ${moveWord(S.rb.ex_rev_q3, S.rb.ex_rev_q4)} (${rpS(S.rb.ex_rev_q3)} → ${rpS(S.rb.ex_rev_q4)}).`, "Medium"],
    ["Apakah ML masih relevan?", `Ya. Q4 ML ${num(Q4.ML.trx)} transaksi (${spct(chg(Q4.ML.trx, Q3.ML.trx), 0)}), GPM ${pct(Q4.ML.gpm)}, dengan profil akun massal yang cepat laku.`, "High"],
    ["Apakah bisnis bergantung pada segelintir transaksi besar?", `Tidak. 20% transaksi teratas = ${pct(S.conc.ALL.top20p, 0)} revenue; 10 transaksi teratas hanya ${pct(S.conc.ALL.top10)}. ML pengecualian (10 teratas = ${pct(S.conc.ML.top10, 0)} revenue ML).`, "High"],
    ["Apakah bergantung pada supplier tertentu?", `Tidak. ${num(S.sup.n)} penjual tercatat, maksimum ${S.sup.max} akun per penjual; 10 teratas ${pct(S.sup.top10)} akun. Data hanya sampai Sep 2025.`, "High"],
    ["Berapa modal yang tertahan di stok?", `${rpS(S.ready.modal)} pada ${num(S.ready.n)} akun Ready per 09/01/2026, dengan nilai jual daftar ${rpS(S.ready.list)}. ${pct(S.ready.rb_share_modal, 0)} modal itu ada di Roblox.`, "High"],
    ["Seberapa cepat akun terjual?", `Median ${S.dts.FF.med} hari (FF), ${S.dts.ML.med} hari (ML), ${S.dts.RB.med} hari (Roblox). ${pct(S.dts.FF.le7, 0)} akun FF laku dalam 7 hari.`, "High"],
    ["Apakah ada indikasi fraud?", `Tidak ada evidence fraud. Ada ${S.loss.n} akun keluar tanpa pendapatan (${rpS(S.loss.modal)}) dan ${S.profit_overwrite} profit yang ditimpa manual; keduanya lebih konsisten dengan kesalahan proses, tetapi alasannya tidak selalu tercatat.`, "Medium"],
    ["Apakah ada transaksi rugi?", "Hanya satu transaksi yang dijual di bawah modal. Beberapa akun dijual seharga modal, sebagian besar ke mitra.", "High"],
    ["Apakah ada pola musiman?", "Belum bisa disimpulkan. Desember tertinggi, tetapi data baru mencakup satu Desember; tidak ada perbedaan berarti antara hari kerja dan akhir pekan.", "Medium"],
    ["Bagaimana awal 2026?", `1–9 Januari: ${NF1.format(S.jan_pace.jan)} transaksi/hari vs ${NF1.format(S.jan_pace.dec)} di Desember. Terlalu pendek dan bertepatan dengan libur; perlu dipantau.`, "Low"],
    ["Apa tuas pertumbuhan terbesar?", `Pasokan FF/ML (hampir selalu habis). +10 akun FF/bulan ≈ +${rpS(10 * Q4.FF.aov * Q4.FF.gpm)} laba kotor/bulan, bila permintaan memang belum terlayani (hipotesis).`, "Medium"],
    ["Apakah harga bisa terus dinaikkan?", `Ada batasnya: kelas Premium ber-GPM ${pct(S.bands[4].gpm)} dan laku median ${S.bands[4].dts} hari, lebih buruk dari kelas Menengah.`, "Medium"],
    ["Seberapa siap tim operasional?", `Rapuh: dua admin menangani ${pct(S.admin.top2_trx_q4, 0)} transaksi Q4 dan ada ${S.admin.n} nama admin dalam 6 bulan.`, "Medium"],
    ["Seberapa andal data ini?", "Cukup andal setelah dibersihkan: format tanggal dan satuan rupiah dikoreksi dengan aturan yang tervalidasi (99,4% cocok dengan kolom Profit). Batasnya: tanpa biaya operasional, tanpa data pembeli, data berhenti 09/01/2026.", "High"],
    ["Peluang Roblox apa yang paling menjanjikan?", `Fish It: median laku ${fi.dts} hari, AOV ${rpS(fi.aov)}, ${S.rb.fishit_dec} transaksi di Desember. Belum teruji dalam jangka panjang.`, "Medium"],
    ["Data apa yang paling dibutuhkan berikutnya?", "Biaya operasional, asal pembeli/kanal, permintaan yang tidak terlayani, dan alasan akun keluar tanpa penjualan.", "High"]];
  const card = h("div", { class: "card" });
  QA.forEach((q, i) => card.appendChild(h("details", { class: "qa", open: i < 3 ? "" : null, html: `<summary><span class="qn">${i + 1}.</span><span>${q[0]}</span></summary><div class="ans">${q[1]} ${conf(q[2])}</div>` })));
  root.append(card);
}

/* ===================== 12. KUALITAS DATA & METODOLOGI ===================== */
function pageMetodologi(root) {
  const r = S.recon;
  root.append(pageHead(12, "Data Quality & Methodology",
    "Data cukup andal untuk analisis setelah dibersihkan, tetapi belum cukup untuk menghitung laba bersih, menganalisis pelanggan, atau memprediksi musiman.",
    `Tiga file spreadsheet (FF ${num(r.per_game.FF)} baris, ML ${num(r.per_game.ML)}, Roblox ${num(r.per_game.RB)}), masing-masing satu sheet. Snapshot ${dt(D.snapshot)}.`));
  root.append(h("div", { class: "card" }, h("h3", {}, "Alur traceability"), h("div", { class: "flow", style: "margin-top:10px" },
    h("div", { class: "st", html: "<b>Raw data</b>3 file xlsx, 2.401 baris" }), h("span", { class: "arrow" }, "→"),
    h("div", { class: "st", html: "<b>Transformasi</b>parse tanggal, normalisasi satuan, hitung ulang profit, flag" }), h("span", { class: "arrow" }, "→"),
    h("div", { class: "st", html: "<b>Metrik</b>revenue, laba kotor, GPM, AOV, sell-through, hari laku" }), h("span", { class: "arrow" }, "→"),
    h("div", { class: "st", html: "<b>Visualisasi</b>agregasi di browser sesuai filter" }), h("span", { class: "arrow" }, "→"),
    h("div", { class: "st", html: "<b>Insight</b>evidence + confidence + label hipotesis" }))));

  root.append(sec("Rekonsiliasi baris"), h("div", { class: "card" }, table({ nosort: true, cols: [{ k: "a", label: "Tahap" }, { k: "n", label: "Baris", num: true, fmt: num }, { k: "x", label: "Keterangan", wrap: true }], rows: [
    { a: "Baris sumber", n: r.rows, x: "Gabungan 3 file" },
    { a: "Baris berisi data", n: r.nonempty, x: `${num(r.empty)} baris kosong/template dikeluarkan` },
    { a: "Status Sold", n: r.sold, x: `${num(r.sold_norev)} di antaranya tanpa harga jual (21 transfer mitra, 15 kerugian)` },
    { a: "Transaksi bernilai jual", n: r.trx, x: "Basis revenue" },
    { a: "Transaksi bertanggal (basis analisis)", n: r.dated, x: `${num(r.trx - r.dated)} transaksi tanpa tanggal jual (${rpS(r.undated_rev)}) tidak bisa ditempatkan di periode` },
    { a: "Basis margin", n: r.margin, x: "Transaksi bertanggal dengan modal > 0" }] })));

  const fm = S.flags.masuk, fj = S.flags.jual;
  const DQ = [
    ["Format tanggal", "1.331 sel datetime adalah teks D/M yang dibaca Excel sebagai M/D. 100% sel datetime punya 'hari' ≤ 12, 100% teks punya hari > 12.", "Critical", "Hari ↔ bulan ditukar; 98,8% tanggal jual menjadi logis (31,6% tanpa ditukar)."],
    ["Tahun tanggal", `Tanpa tahun: ${fm.tahun_diinfer || 0} masuk, ${fj.tahun_jual_diinfer || 0} jual. Melewati snapshot: ${(fm.tahun_lewat_snapshot_dikoreksi || 0) + (fj.tahun_jual_lewat_snapshot_dikoreksi || 0)}. Typo pergantian tahun: ${fj.tahun_jual_typo_dikoreksi || 0}.`, "High", "Tahun diinfer dari snapshot dan urutan baris; semua diberi flag."],
    ["Satuan nominal", "Modal/Jual campur satuan ribu (150) dan rupiah penuh (150000), bahkan dalam satu baris.", "Critical", "< 1.000 dikali 1.000; cocok dengan kolom Profit pada 1.879 dari 1.891 baris (99,4%)."],
    ["Konsistensi profit", `${S.profit_overwrite} baris Profit tercatat ≠ Jual − Modal.`, "Medium", "Profit dihitung ulang."],
    ["Sold tanpa harga jual", `${r.sold_norev} baris: 21 transfer ke mitra tanpa nilai dan 15 kerugian. Bersama 7 baris berstatus '-', total ${S.loss.n} akun dengan modal ${rpS(S.loss.modal)} keluar tanpa pendapatan.`, "High", "Keluar dari transaksi; dilaporkan sebagai kebocoran."],
    ["Modal kosong/0", "27 transaksi tanpa modal valid.", "Medium", "Keluar dari basis margin saja."],
    ["Tanggal masuk kosong", "Roblox 149 baris (23,5%), FF 32, ML 1.", "Medium", "Tidak diimputasi; umur stok parsial."],
    ["Kode akun ganda", "ML-006 dan ML-014 dipakai dua kali untuk akun berbeda.", "Low", "Primary key = file + nomor baris."],
    ["Akun dijual ulang", `${S.resale.accounts} akun (ID game sama) muncul lebih dari sekali.`, "Info", "Dipertahankan sebagai pola bisnis."],
    ["Struktur kolom", "Nama admin di kolom Jenis Game/kolom tanpa header (Roblox); subkategori Roblox pindah kolom; Harga Mitra FF tanpa header.", "Medium", "Parsing berbasis aturan."],
    ["Coverage atribut", "Admin baru tercatat sejak Jul 2025; kontak penjual 0% sejak Okt 2025.", "Medium", "Analisis dibatasi pada periode yang tersedia."]];
  root.append(sec("Data quality report"), h("div", { class: "card" }, table({ cols: [{ k: "a", label: "Dimensi" }, { k: "b", label: "Temuan", wrap: true }, { k: "c", label: "Severity", sv: r => ({ Critical: 4, High: 3, Medium: 2, Low: 1, Info: 0 })[r.c] }, { k: "d", label: "Penanganan", wrap: true }], rows: DQ.map(x => ({ a: x[0], b: x[1], c: x[2], d: x[3] })) })));

  root.append(grid("g2",
    h("div", { class: "card" }, h("h3", {}, "Data dictionary (setelah harmonisasi)"), table({ nosort: true, cols: [{ k: "c", label: "Kolom" }, { k: "m", label: "Arti", wrap: true }, { k: "s", label: "Sumber" }], rows: [
      { c: "game", m: "Lini produk", s: "nama file" }, { c: "kode", m: "Kode akun internal (tidak unik)", s: "Kode Akun" },
      { c: "tgl_masuk", m: "Tanggal akun masuk stok", s: "Tanggal" }, { c: "tgl_jual", m: "Tanggal terjual", s: "SOLD TGL / Sold tgl" },
      { c: "modal", m: "Harga beli akun (COGS)", s: "Harga (FF) / Modal" }, { c: "jual", m: "Harga jual", s: "Jual" },
      { c: "profit", m: "Jual − Modal (dihitung ulang)", s: "turunan" }, { c: "status", m: "Sold / Ready / '-'", s: "STATUS / Status Acc(r)" },
      { c: "kanal", m: "Langsung / " + MJ + " dijualkan / dibeli mitra", s: "tag di Kode Akun & Notes" },
      { c: "subkategori", m: "Subkategori Roblox", s: "Jenis Game, Ket. Singkat, STOCK/JASA POST" },
      { c: "admin", m: "Admin yang menangani penjualan (interpretasi)", s: "Notes / kolom tanpa header" },
      { c: "penjual", m: "ID pseudonim penjual akun", s: "Kontak Whatsapp" },
      { c: "harga mitra", m: "= Modal × 1,05 (FF, ML) / × 1,30 (Roblox); tidak dipakai", s: "Harga Mitra" }] })),
    h("div", { class: "card" }, h("h3", {}, "Formula KPI"), table({ nosort: true, cols: [{ k: "k", label: "KPI" }, { k: "f", label: "Formula", wrap: true }], rows: [
      { k: "Revenue", f: "Σ Jual pada transaksi bertanggal" }, { k: "Laba kotor", f: "Σ (Jual − Modal) pada basis margin" },
      { k: "GPM", f: "Laba kotor ÷ Revenue (basis margin yang sama)" }, { k: "AOV", f: "Revenue ÷ jumlah transaksi" },
      { k: "Efek volume / AOV", f: "ΔTrx × AOV lama / ΔAOV × Trx baru" }, { k: "Sell-through kohort", f: "Akun terjual ÷ akun masuk pada bulan masuk yang sama" },
      { k: "Hari laku", f: "Tanggal jual − tanggal masuk (≥ 0)" }, { k: "Modal tertahan", f: "Σ Modal akun Ready per snapshot" },
      { k: "Konsentrasi", f: "Revenue top-N transaksi ÷ revenue total" }, { k: "Anomali harian", f: "|revenue − median 28 hari| ÷ (1,4826 × MAD) > 3,5" }] }))
  ));

  root.append(sec("Aturan cleaning, pengecualian, dan asumsi"), grid("g2",
    h("div", { class: "card", html: `<h3>Aturan cleaning</h3><ol style="margin:8px 0 0;padding-left:20px;display:grid;gap:5px;color:var(--ink-2)">
      <li>Sel datetime: hari dan bulan ditukar (salah baca D/M sebagai M/D).</li>
      <li>Teks D/M[/Y]; tahun dua digit → 20YY.</li>
      <li>Tahun hilang/invalid → tahun terbaru ≤ snapshot, atau yang konsisten dengan tanggal masuk.</li>
      <li>Tanggal setelah snapshot 09/01/2026 → tahun dikurangi satu.</li>
      <li>Tanggal masuk yang menyimpang > 60 hari dari median 14 baris tetangga → koreksi tahun ±1.</li>
      <li>Tanggal jual sebelum tanggal masuk dan wajar bila +1 tahun → dikoreksi.</li>
      <li>Nominal < 1.000 dikali 1.000; ≥ 1.000 apa adanya.</li>
      <li>Profit = Jual − Modal.</li>
      <li>Normalisasi status, nama game, kode akun, nama admin.</li>
      <li>Tidak ada baris yang dihapus; pengecualian memakai kolom flag.</li></ol>` }),
    h("div", { class: "card", html: `<h3>Pengecualian dan asumsi</h3><ul style="margin:8px 0 0;padding-left:18px;display:grid;gap:5px;color:var(--ink-2)">
      <li>Akun Sold tanpa harga jual tidak dihitung sebagai transaksi. Yang bukan transaksi mitra dicatat sebagai kebocoran.</li>
      <li>Transaksi tanpa modal tetap masuk revenue, tetapi tidak masuk perhitungan margin.</li>
      <li>${D.mitra_code ? `"${D.mitra_code}" = mitra re-seller. "(nnn ${D.mitra_code})" = akun dijual lewat mitra; "Dibeli ${D.mitra_code}" = akun dibeli mitra.` : "Kode mitra di kolom Kode Akun menandai kanal mitra re-seller: akun dijual lewat mitra, atau akun dibeli mitra."}</li>
      <li>Kontak WhatsApp = penjual akun ke perusahaan, bukan pembeli; karena itu halaman Customer Analytics dihilangkan.</li>
      <li>Kolom Notes berisi nama admin (interpretasi; confidence Medium).</li>
      <li>Arti label FS belum dikonfirmasi; dianalisis tanpa ditafsirkan.</li>
      <li>Januari 2026 hanya 1–9 Januari dan tidak dibandingkan langsung dengan bulan penuh.</li></ul>` })
  ));

  root.append(grid("g2",
    h("div", { class: "card", html: `<h3>What the data can tell us</h3><ul style="margin:8px 0 0;padding-left:18px;display:grid;gap:5px;color:var(--ink-2)">
      <li>Revenue, laba kotor, GPM, dan AOV per game, kanal, kelas harga, dan bulan.</li>
      <li>Kecepatan jual, sell-through, dan umur stok.</li>
      <li>Kebocoran akun tanpa pendapatan dan kualitas pencatatan.</li>
      <li>Ketergantungan pada game, admin, kanal, dan penjual akun.</li>
      <li>Perubahan struktural dan anomali harian.</li></ul>` }),
    h("div", { class: "card", html: `<h3>What the data cannot tell us</h3><ul style="margin:8px 0 0;padding-left:18px;display:grid;gap:5px;color:var(--ink-2)">
      <li>Laba bersih dan efisiensi biaya: biaya operasional tidak tercatat.</li>
      <li>Perilaku pelanggan (repeat, retensi, CLV): tidak ada ID pembeli.</li>
      <li>Apakah kanal mitra menambah atau menggantikan penjualan langsung.</li>
      <li>Permintaan yang tidak terlayani karena stok kosong.</li>
      <li>Musiman tahunan, YoY, dan pola jam transaksi.</li>
      <li>Kondisi setelah 09/01/2026.</li></ul>` })
  ));
  root.append(h("div", { class: "card", style: "margin-top:16px", html: `<h3>Data tambahan yang dibutuhkan</h3><ul style="margin:8px 0 0;padding-left:18px;display:grid;gap:5px;color:var(--ink-2)">
    <li>Biaya operasional bulanan (iklan, fee pembayaran, gaji/komisi admin).</li>
    <li>Kanal dan identitas pembeli (minimal pseudonim) untuk analisis pelanggan dan kanibalisasi mitra.</li>
    <li>Log permintaan yang tidak terlayani (akun dicari tapi tidak ada stok).</li>
    <li>Alasan setiap akun yang keluar tanpa penjualan, garansi, dan refund.</li>
    <li>Target bulanan per game agar aktual vs target bisa dibandingkan.</li></ul>` }));

  const dq = D.dq.map(x => ({ ...x, det: x.jenis.startsWith("Tanggal") ? `masuk ${dt(x.a)}, jual ${dt(x.b)}` : x.jenis.startsWith("Profit") ? `tercatat ${rp(x.a)} vs hitung ${rp(x.b)}` : `modal ${rp(x.a)}, jual ${rp(x.b)}` }));
  root.append(sec("Daftar anomali pencatatan"), h("div", { class: "card" }, table({ cols: [{ k: "jenis", label: "Jenis" }, { k: "kode", label: "Kode" }, { k: "game", label: "Game" }, { k: "det", label: "Detail" }, { k: "nilai", label: "Selisih / profit", num: true, fmt: v => (v === null || v === undefined ? "—" : rp(v)) }], rows: dq, sort: { k: "jenis", desc: false } })));
  root.append(h("div", { class: "card", style: "margin-top:16px", html: PUB
    ? `<h3>Catatan versi publik</h3><p class="csub" style="margin:6px 0 0">Nama perusahaan disamarkan menjadi PT XYZ dan nama admin menjadi Admin A, B, dan seterusnya. Nilai rupiah setiap transaksi dikalikan faktor rahasia dengan variasi kecil per baris (±4%), sehingga harga asli tidak bisa ditebak. Tanggal, jumlah transaksi, dan kelas harga sesuai data asli; persentase dan rasio hanya bergeser sangat kecil (umumnya di bawah 0,2 poin). Data mentah, nomor kontak, ID akun game, dan tautan tidak disertakan.</p>`
    : `<h3>Catatan versi internal</h3><p class="csub" style="margin:6px 0 0">Versi ini memakai angka dan nama asli. Jangan dibagikan di luar perusahaan; gunakan versi publik untuk portofolio.</p>` }));
}

/* ===================== NAVIGASI & INIT ===================== */
const PAGES = [
  ["ringkasan", "Ringkasan Eksekutif", pageRingkasan], ["revenue", "Kesehatan Bisnis & Revenue", pageRevenue],
  ["transaksi", "Transaksi & AOV", pageTransaksi], ["produk", "Performa Produk", pageProduk],
  ["waktu", "Waktu, Tren & Anomali", pageWaktu], ["operasional", "Operasional & Stok", pageOperasional],
  ["risiko", "Konsentrasi & Risiko", pageRisiko], ["peluang", "Peluang & Skenario", pagePeluang],
  ["keputusan", "Perbandingan & Keputusan", pageKeputusan], ["register", "Insight Register & Monitoring", pageRegister],
  ["qa", "Executive Q&A", pageQA], ["metodologi", "Data Quality & Methodology", pageMetodologi]];

function render(keepScroll) {
  const y = window.scrollY;
  DRAWERS.length = 0;
  Charts.hideTip();
  const root = document.getElementById("page");
  root.replaceChildren();
  const p = PAGES.find(x => x[0] === ST.page) || PAGES[0];
  p[2](root);
  root.append(h("div", { class: "foot", html: `${esc(D.company)} · Data ${dt(D.first)} – ${dt(D.snapshot)} · Format angka Indonesia · ${PUB ? "Versi publik (nilai rupiah disamarkan)" : "Versi internal"}` }));
  document.querySelectorAll(".nav button").forEach(b => b.setAttribute("aria-current", b.dataset.id === ST.page ? "page" : "false"));
  document.title = `${p[1]} · Dashboard Jual Beli Akun · ${D.company_short}`;
  if (keepScroll) window.scrollTo(0, y); else window.scrollTo(0, 0);
}

function initUI() {
  document.getElementById("brand-co").textContent = D.company_short;
  const nav = document.getElementById("nav");
  PAGES.forEach(([id, title], i) => {
    const b = h("button", { type: "button", "data-id": id }, h("span", { class: "no" }, String(i + 1)), title);
    b.addEventListener("click", () => { ST.page = id; try { history.replaceState(null, "", "#" + id); } catch (e) {} document.querySelector(".sidebar").classList.remove("open"); render(false); });
    nav.appendChild(b);
  });
  // filter periode
  const ps = document.getElementById("f-preset"), fr = document.getElementById("f-from"), to = document.getElementById("f-to"), cust = document.getElementById("f-custom");
  PRESETS.forEach(p => ps.appendChild(h("option", { value: p.id }, p.label)));
  MONTHS.forEach(m => { fr.appendChild(h("option", { value: m }, mLong(m))); to.appendChild(h("option", { value: m }, mLong(m))); });
  const sync = () => { ps.value = ST.preset; fr.value = ST.from; to.value = ST.to; cust.hidden = ST.preset !== "custom"; };
  ps.addEventListener("change", () => { const p = PRESETS.find(x => x.id === ps.value); ST.preset = p.id; if (p.r) { ST.from = p.r[0]; ST.to = p.r[1]; } sync(); render(true); });
  const onRange = () => { let a = +fr.value, b = +to.value; if (a > b) [a, b] = [b, a]; ST.from = a; ST.to = b; ST.preset = "custom"; sync(); render(true); };
  fr.addEventListener("change", onRange); to.addEventListener("change", onRange);
  sync();
  // filter game
  const chips = document.getElementById("f-games");
  GN.forEach((g, i) => {
    const b = h("button", { type: "button", class: "chip", "aria-pressed": "true" }, h("span", { class: "dot", style: `background:${GCOL[i]}` }), g);
    b.addEventListener("click", () => {
      if (ST.games[i] && ST.games.filter(Boolean).length === 1) return;
      ST.games[i] = !ST.games[i]; b.setAttribute("aria-pressed", String(ST.games[i])); render(true);
    });
    chips.appendChild(b);
  });
  document.getElementById("f-note").textContent = `Data s.d. ${dt(D.snapshot)}`;
  // tema
  const tb = document.getElementById("theme-btn");
  const setTheme = t => { if (t) document.documentElement.setAttribute("data-theme", t); else document.documentElement.removeAttribute("data-theme"); try { t ? localStorage.setItem("dash-theme", t) : localStorage.removeItem("dash-theme"); } catch (e) {} };
  try { const t = localStorage.getItem("dash-theme"); if (t) document.documentElement.setAttribute("data-theme", t); } catch (e) {}
  tb.addEventListener("click", () => {
    const dark = document.documentElement.getAttribute("data-theme") === "dark" || (!document.documentElement.getAttribute("data-theme") && matchMedia("(prefers-color-scheme: dark)").matches);
    setTheme(dark ? "light" : "dark"); render(true);
  });
  document.getElementById("menu-btn").addEventListener("click", () => document.querySelector(".sidebar").classList.toggle("open"));
  const hsh = location.hash.slice(1);
  if (PAGES.some(p => p[0] === hsh)) ST.page = hsh;
  let rt;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => DRAWERS.forEach(f => f()), 150); });
  render(false);
}
initUI();
