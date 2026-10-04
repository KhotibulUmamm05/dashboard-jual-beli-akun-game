/* Halaman 1–6 */
const K = S.kanal, Q3 = S.q3, Q4 = S.q4;
const mtrx = ym => S.monthly_trx[String(Math.floor(ym / 100)) + "-" + String(ym % 100).padStart(2, "0")] || 0;
const H2M = [202509, 202510, 202511, 202512].map(mtrx);

function revMonthlyAll() {
  return MONTHS.map(ym => TRX.filter(t => t.ym === ym).reduce((a, t) => a + t.r, 0));
}
const RMALL = revMonthlyAll();
const rangeRev = (a, b) => { const v = RMALL.slice(mi(a), mi(b) + 1); return [Math.min(...v), Math.max(...v)]; };

/* ===================== 1. RINGKASAN EKSEKUTIF ===================== */
function pageRingkasan(root) {
  const C = cur(), P = prev(), A = agg(C), B = agg(P);
  const pr = prevRange();
  root.append(pageHead(1, "Ringkasan Eksekutif",
    `Revenue Q4 2025 naik ${pct(chg(Q4.rev, Q3.rev))} menjadi ${rpS(Q4.rev)}, tetapi kenaikannya hampir seluruhnya dari nilai transaksi yang lebih tinggi. Volume mendatar dan margin mulai tertekan kanal mitra.`,
    `Ringkasan untuk CEO dan investor. Data penjualan ${dt(D.first)} – ${dt(D.snapshot)} dari tiga lini: Free Fire, Mobile Legends, dan Roblox. Kondisi stok per ${dt(D.snapshot)}.`));

  // sparkline: 12 bulan terakhir s.d. akhir periode
  const end = mi(ST.to), start = Math.max(0, end - 11);
  const sv = MONTHS.slice(start, end + 1).map(ym => TRX.filter(t => t.ym === ym && gOn(t.g)).reduce((a, t) => a + t.r, 0));
  const hiFrom = Math.max(0, mi(ST.from) - start);
  const ready = STK.filter(x => x.st === 1 && gOn(x.g));
  const readyModal = ready.reduce((a, x) => a + Math.max(0, x.m), 0);
  root.append(grid("g-kpi",
    kpi("Revenue", rpS(A.rev), deltaEl(A.rev, B && B.rev), pr ? `vs ${rangeLabel(pr)}: ${rpS(B.rev)}` : "", Charts.spark(sv, "var(--s-ff)", 150, 30, hiFrom)),
    kpi("Laba kotor", rpS(A.gp), deltaEl(A.gp, B && B.gp), pr ? `vs ${rpS(B.gp)}` : ""),
    kpi("Gross profit margin", pct(A.gpm), deltaEl(A.gpm, B && B.gpm, "pp"), pr ? `vs ${pct(B.gpm)}` : ""),
    kpi("Transaksi", num(A.trx), deltaEl(A.trx, B && B.trx), pr ? `vs ${num(B.trx)}` : ""),
    kpi("AOV (nilai rata-rata)", rpS(A.aov), deltaEl(A.aov, B && B.aov), pr ? `vs ${rpS(B.aov)}` : ""),
    kpi("Stok Ready (snapshot)", num(ready.length) + " akun", null, `modal tertahan ${rpS(readyModal)} · tidak ikut filter periode`)
  ));

  const exm = [202509, 202510, 202511, 202512].map(mtrx);
  const blocks = h("div", { class: "exec-grid", style: "margin-top:16px" },
    h("div", { class: "card", html: `<h3>Status bisnis ${conf("High")}</h3><ul>
      <li>Bisnis tumbuh dan menguntungkan. Revenue H2 2025 <b>${rpS(S.h2.rev)}</b>, naik ${pct(chg(S.h2.rev, S.h1.rev), 0)} dari H1, dengan GPM <b>${pct(S.h2.gpm)}</b>.</li>
      <li>Sejak September volume tertahan di <b>${Math.min(...exm)}–${Math.max(...exm)} transaksi per bulan</b>. Pertumbuhan Q4 datang dari harga per transaksi.</li>
      <li>Free Fire tetap tulang punggung: ${pct(S.conc.rev_share.FF, 0)} revenue dan ${pct(S.conc.gp_share.FF, 0)} laba kotor sepanjang data.</li></ul>` }),
    h("div", { class: "card", html: `<h3>Pergerakan utama (Q4 vs Q3)</h3><ul>
      <li>Revenue ${rpS(Q3.rev)} → <b>${rpS(Q4.rev)}</b> (${spct(chg(Q4.rev, Q3.rev))}).</li>
      <li>Transaksi ${num(Q3.trx)} → <b>${num(Q4.trx)}</b> (${spct(chg(Q4.trx, Q3.trx))}); AOV ${spct(chg(Q4.aov, Q3.aov))}.</li>
      <li>GPM ${pct(Q3.gpm)} → <b>${pct(Q4.gpm)}</b> (${spp(Q4.gpm - Q3.gpm)}).</li>
      <li>Per game: ML ${spct(chg(Q4.ML.rev, Q3.ML.rev), 0)}, FF ${spct(chg(Q4.FF.rev, Q3.FF.rev))}, Roblox ${spct(chg(Q4.RB.rev, Q3.RB.rev))}.</li>
      <li>Desember 2025 bulan tertinggi: <b>${rpS(S.dec.rev)}</b> (${spct(chg(S.dec.rev, S.nov.rev))} dari November).</li></ul>` }),
    h("div", { class: "card", html: `<h3>Penggerak utama ${conf("High")}</h3><ul>
      <li>Efek kenaikan AOV <b>${srp(S.dec_q4q3.ALL.aov)}</b>, efek volume hanya <b>${srp(S.dec_q4q3.ALL.vol)}</b>.</li>
      <li>Kanal ${MJ} (mulai ${dt(K.start)}) sudah <b>${pct(K.q4.mitra_share)}</b> revenue Q4.</li>
      <li>Roblox turun karena stok borongan Juli habis. Di luar batch itu revenue Roblox ${moveWord(S.rb.ex_rev_q3, S.rb.ex_rev_q4)} (${rpS(S.rb.ex_rev_q3)} → ${rpS(S.rb.ex_rev_q4)}).</li>
      <li>ML pindah ke akun massal: AOV ${rpS(S.ml.aov_h1)} → ${rpS(S.ml.aov_h2)}, GPM ${pct(S.ml.gpm_h1, 0)} → ${pct(S.ml.gpm_h2, 0)}.</li></ul>` }),
    h("div", { class: "card", html: `<h3>Risiko</h3><ul>
      <li><b>Margin kanal mitra ${pct(K.q4.mitra_gpm)}</b> vs ${pct(K.q4.Langsung.gpm)} di kanal langsung; selisihnya ±${rpS(K.gap_q4)} laba kotor di Q4. ${conf("High")}</li>
      <li>Ketergantungan: FF ${pct(S.conc.rev_share.FF, 0)} revenue; dua admin menangani ${pct(S.admin.top2_trx_q4, 0)} transaksi Q4. ${conf("Medium")}</li>
      <li>Stok Roblox lambat: ${num(S.ready.RB.n)} akun Ready, modal ${rpS(S.ready.RB.modal)}; ${S.rb.batch_ready} akun batch Juli belum laku ±${S.ready.batch_age} hari. ${conf("High")}</li>
      <li>Pencatatan melemah: kontak penjual tidak dicatat sejak Okt 2025; ${S.loss.n} akun hilang tanpa pendapatan (${rpS(S.loss.modal)}). ${conf("High")}</li></ul>` }),
    h("div", { class: "card", html: `<h3>Peluang</h3><ul>
      <li>FF dan ML hampir selalu habis: sell-through kohort FF ${pct(S.sellthrough.FF.min, 0)}–100%, median laku ${S.dts.FF.med} hari. Ruang menambah pasokan. ${HYP} ${conf("Medium")}</li>
      <li>Tren Roblox <b>Fish It</b>: median laku ${S.rb.seg["Fish It"].dts} hari, AOV ${rpS(S.rb.seg["Fish It"].aov)}. ${conf("Medium")}</li>
      <li>Menutup separuh selisih margin mitra ≈ <b>+${rpS(K.gap_q4 / 2)}</b> laba kotor per kuartal. ${HYP} ${conf("Medium")}</li>
      <li>Stok Ready bernilai daftar ${rpS(S.ready.list)} (modal ${rpS(S.ready.modal)}) bisa dicairkan. ${conf("High")}</li></ul>` }),
    h("div", { class: "card implication", html: `<h3>Implikasi untuk manajemen</h3><ol>
      <li>Tetapkan aturan main kanal mitra (batas margin atau jenis stok yang boleh) sebelum porsinya membesar.</li>
      <li>Jadikan pasokan FF/ML tuas pertumbuhan utama: target stok masuk ≥ penjualan bulan sebelumnya, dan catat permintaan yang tidak terlayani.</li>
      <li>Bersihkan stok Roblox > 90 hari dan ganti pola beli Roblox ke batch kecil yang mengikuti tren.</li>
      <li>Kembalikan disiplin pencatatan: kontak penjual, tanggal masuk, satuan rupiah, alasan kerugian.</li></ol>` })
  );
  root.append(blocks);

  root.append(sec("Revenue per bulan"));
  const revM = monthlySeries(rs => rs.reduce((a, t) => a + t.r, 0));
  const ser = activeGames().map(g => ({ name: GN[g], color: GCOL[g], values: revM[g] }));
  root.append(chartCard({
    title: "Revenue bulanan per game", sub: "Area berwarna = periode terpilih. Jan 2026 hanya 1–9 Jan.",
    legend: ser.map(x => ({ name: x.name, color: x.color })),
    draw: el => Charts.bar(el, { labels: MONTHS, xFmt: mLab, series: ser, stacked: true, yFmt: rpAx, tipFmt: v => rpS(v), band: bandIdx(), height: 260, tipHeader: l => mLong(l) }),
    table: () => ({ cols: [{ k: "m", label: "Bulan" }, ...ser.map((x, i) => ({ k: "v" + i, label: x.name, num: true, fmt: rp })), { k: "t", label: "Total", num: true, fmt: rp }],
      rows: MONTHS.map((ym, i) => { const r = { m: mLong(ym), _i: i, t: 0 }; ser.forEach((x, k) => { r["v" + k] = x.values[i]; r.t += x.values[i]; }); return r; }) })
  }));
}

/* ===================== 2. KESEHATAN BISNIS & REVENUE ===================== */
function pageRevenue(root) {
  const C = cur(), P = prev(), A = agg(C), B = agg(P);
  const [lo, hi] = rangeRev(202509, 202512);
  root.append(pageHead(2, "Kesehatan Bisnis & Revenue",
    `Revenue H2 2025 ${rpS(S.h2.rev)}, naik ${pct(chg(S.h2.rev, S.h1.rev), 0)} dari H1. Sejak September revenue bulanan bergerak di ${rpS(lo, 0)}–${rpS(hi, 0)} dan pertumbuhannya kini bertumpu pada harga, bukan volume.`,
    "Bisnis tumbuh, tetapi mesin pertumbuhannya berganti: dari menambah jumlah transaksi menjadi menaikkan nilai per transaksi."));

  root.append(story(
    { t: "Pertumbuhan 2025 terjadi dalam dua fase: ekspansi volume (Feb–Sep), lalu fase datar (Sep–Des).", c: "High",
      e: `Transaksi bulanan naik dari ${mtrx(202502)} (Feb) ke <b>${mtrx(202509)}</b> (Sep), lalu ${H2M.slice(1).join(" → ")} (Okt–Des). H2 vs H1: transaksi ${spct(chg(S.h2.trx, S.h1.trx), 0)}, AOV ${spct(chg(S.h2.aov, S.h1.aov), 0)}.`,
      i: "Pertumbuhan berikutnya butuh tambahan volume (pasokan dan kanal) atau harga yang lebih tinggi dan bertahan. Keduanya perlu dipantau bulanan." },
    { t: `Desember jadi bulan tertinggi (${rpS(S.dec.rev)}, ${spct(chg(S.dec.rev, S.nov.rev))} dari November), didorong nilai transaksi.`, c: "Medium",
      why: "Satu bulan; pola musiman belum bisa dibuktikan",
      e: `Transaksi hanya ${spct(chg(S.dec.trx, S.nov.trx))}. Median nilai transaksi ${rpS(S.nov.med)} → ${rpS(S.dec.med)}; porsi revenue kelas Premium ${pct(S.nov.share_premium)} → ${pct(S.dec.share_premium)}. Tanpa kelas Premium, AOV tetap naik ${pct(chg(S.dec.aov_ex_sp, S.nov.aov_ex_sp))}.`,
      i: "Kenaikan merata, bukan karena 1–2 transaksi besar. Apakah ini efek akhir tahun (libur sekolah) belum bisa dipastikan karena data baru punya satu Desember." },
    { t: `GPM naik dari ${pct(S.h1.gpm)} (H1) ke ${pct(S.h2.gpm)} (H2), lalu turun tipis di Q4.`, c: "High",
      e: `Bauran bergeser ke akun murah bermarkup tinggi, dan GPM ML membaik (${pct(S.ml.gpm_h1, 0)} → ${pct(S.ml.gpm_h2, 0)}). Q3 → Q4: ${pct(Q3.gpm)} → ${pct(Q4.gpm)}; GPM kanal langsung justru naik ${pct(K.q3.Langsung.gpm)} → ${pct(K.q4.Langsung.gpm)}.`,
      i: "Penurunan GPM Q4 berasal dari kanal mitra, bukan dari harga jual di kanal langsung (lihat halaman 4 dan 9)." }
  ));

  // A. revenue trend
  let mode = "m";
  const ctrl = h("div", { class: "seg", role: "group", "aria-label": "Granularitas" });
  const revM = monthlySeries(rs => rs.reduce((a, t) => a + t.r, 0));
  const ser = activeGames().map(g => ({ name: GN[g], color: GCOL[g], values: revM[g] }));
  const weeks = (() => {
    const map = new Map();
    TRX.filter(t => gOn(t.g) && t.d >= 20250301).forEach(t => {
      const d = new Date(Math.floor(t.d / 10000), Math.floor(t.d / 100) % 100 - 1, t.d % 100);
      const mon = new Date(d); mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      const k = mon.getFullYear() * 10000 + (mon.getMonth() + 1) * 100 + mon.getDate();
      map.set(k, (map.get(k) || 0) + t.r);
    });
    const keys = [...map.keys()].sort();
    return { keys, vals: keys.map(k => map.get(k)) };
  })();
  let card;
  const drawA = el => {
    if (mode === "m") Charts.bar(el, { labels: MONTHS, xFmt: mLab, series: ser, stacked: true, yFmt: rpAx, tipFmt: v => rpS(v), band: bandIdx(), height: 270, tipHeader: l => mLong(l) });
    else {
      const ws = weeks.keys;
      const b0 = ws.findIndex(k => Math.floor(k / 100) >= ST.from), b1 = ws.length - 1 - [...ws].reverse().findIndex(k => Math.floor(k / 100) <= ST.to);
      Charts.line(el, { labels: ws, xFmt: k => dt(k).slice(0, 5), series: [{ name: "Revenue mingguan", color: "var(--s-ff)", values: weeks.vals }], yFmt: rpAx, tipFmt: v => rpS(v), band: b0 >= 0 && b1 >= b0 ? [b0, b1] : null, height: 270, area: true, tipHeader: k => "Minggu mulai " + dt(k) });
    }
  };
  [["m", "Bulanan"], ["w", "Mingguan"]].forEach(([k, l]) => {
    const b = h("button", { type: "button", "aria-pressed": String(k === mode) }, l);
    b.addEventListener("click", () => { mode = k; ctrl.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); card._redraw(); });
    ctrl.appendChild(b);
  });
  card = chartCard({
    title: "Revenue per periode", sub: "Bulanan bertumpuk per game, atau total mingguan (Senin–Minggu). Area berwarna = periode terpilih.",
    legend: ser.map(x => ({ name: x.name, color: x.color })), controls: ctrl, draw: drawA,
    table: () => ({ cols: [{ k: "m", label: "Bulan" }, { k: "t", label: "Revenue", num: true, fmt: rp }, { k: "g", label: "MoM", num: true, fmt: v => spct(v) }, ...ser.map((x, i) => ({ k: "v" + i, label: x.name, num: true, fmt: rp }))],
      rows: MONTHS.map((ym, i) => { const r = { m: mLong(ym), t: 0 }; ser.forEach((x, k) => { r["v" + k] = x.values[i]; r.t += x.values[i]; }); return r; }).map((r, i, arr) => Object.assign(r, { g: i ? chg(r.t, arr[i - 1].t) : null })), sort: null })
  });
  root.append(sec("Tren revenue"), card);

  // B. GPM per game
  const gpmM = monthlySeries(rs => { const a = agg(rs); return a.trx >= 5 ? a.gpm : null; });
  const gser = activeGames().map(g => ({ name: GN[g], short: GC[g], color: GCOL[g], values: cut(gpmM[g]) }));
  root.append(grid("g2",
    chartCard({ title: "GPM bulanan per game", sub: "Bulan dengan < 5 transaksi tidak ditampilkan agar tidak menyesatkan. " + PARTIAL_NOTE,
      legend: gser.map(x => ({ name: x.name, color: x.color, kind: "ln" })), legendKind: "ln",
      draw: el => Charts.line(el, { labels: TM(), xFmt: mLab, series: gser, yFmt: v => pct(v, 0), tipFmt: v => pct(v), yMin: 0, yMax: 0.8, band: bandIdx(), height: 250, tipHeader: l => mLong(l) }),
      table: () => ({ cols: [{ k: "m", label: "Bulan" }, ...gser.map((x, i) => ({ k: "v" + i, label: x.name, num: true, fmt: v => pct(v) }))], rows: TM().map((ym, i) => { const r = { m: mLong(ym) }; gser.forEach((x, k) => r["v" + k] = x.values[i]); return r; }) }) }),
    (() => {
      // kontribusi per game
      const rows = activeGames().map(g => {
        const a = agg(C.filter(t => t.g === g)), b = P ? agg(P.filter(t => t.g === g)) : null;
        return { g: GN[g], rev: a.rev, sh: A.rev ? a.rev / A.rev : null, d: b ? chg(a.rev, b.rev) : null, gp: a.gp, gpm: a.gpm, trx: a.trx };
      });
      rows.push({ g: "Total", rev: A.rev, sh: 1, d: B ? chg(A.rev, B.rev) : null, gp: A.gp, gpm: A.gpm, trx: A.trx, _cls: "grp" });
      return h("div", { class: "card" }, h("h3", {}, "Kontribusi per game (periode terpilih)"), h("div", { class: "csub" }, "Δ = perubahan revenue vs periode pembanding."),
        table({ cols: [{ k: "g", label: "Game" }, { k: "rev", label: "Revenue", num: true, fmt: rpS }, { k: "sh", label: "Kontribusi", num: true, fmt: v => pct(v) },
          { k: "d", label: "Δ revenue", num: true, fmt: v => spct(v), cls: r => (r.d > 0 ? "up-t" : r.d < 0 ? "down-t" : "") }, { k: "gp", label: "Laba kotor", num: true, fmt: rpS }, { k: "gpm", label: "GPM", num: true, fmt: v => pct(v) }, { k: "trx", label: "Trx", num: true, fmt: num }], rows }));
    })()
  ));

  // C. multi-periode
  const cmp = (a, b, label) => {
    const fa = TRX.filter(t => inR(t.ym, a) && gOn(t.g)), fb = TRX.filter(t => inR(t.ym, b) && gOn(t.g));
    const A1 = agg(fa), B1 = agg(fb);
    return { p: label, a: rpS(B1.rev) + " → " + rpS(A1.rev), dr: chg(A1.rev, B1.rev), dt: chg(A1.trx, B1.trx), da: chg(A1.aov, B1.aov), g: pct(B1.gpm) + " → " + pct(A1.gpm), dg: A1.gpm - B1.gpm };
  };
  const rows = [];
  const pr = prevRange();
  if (pr) rows.push(cmp([ST.from, ST.to], pr, "Periode terpilih vs sebelumnya"));
  rows.push(cmp([202512, 202512], [202511, 202511], "Des vs Nov 2025"), cmp([202510, 202512], [202507, 202509], "Q4 vs Q3 2025"), cmp([202507, 202512], [202501, 202506], "H2 vs H1 2025"));
  const cl = k => r => (r[k] > 0.0005 ? "up-t" : r[k] < -0.0005 ? "down-t" : "");
  root.append(sec("Perbandingan multi-periode"), h("div", { class: "card" },
    h("div", { class: "csub" }, "Mengikuti filter game. YoY tidak ditampilkan karena belum ada 12 bulan data paralel."),
    table({ nosort: true, cols: [{ k: "p", label: "Perbandingan" }, { k: "a", label: "Revenue" }, { k: "dr", label: "Δ Revenue", num: true, fmt: v => spct(v), cls: cl("dr") }, { k: "dt", label: "Δ Transaksi", num: true, fmt: v => spct(v), cls: cl("dt") }, { k: "da", label: "Δ AOV", num: true, fmt: v => spct(v), cls: cl("da") }, { k: "g", label: "GPM" }, { k: "dg", label: "Δ GPM", num: true, fmt: v => spp(v), cls: cl("dg") }], rows })));
}

/* ===================== 3. TRANSAKSI & AOV ===================== */
function pageTransaksi(root) {
  const C = cur(), P = prev();
  const dq = S.dec_q4q3.ALL;
  root.append(pageHead(3, "Transaksi & AOV",
    `Kenaikan revenue Q4 sebesar ${srp(Q4.rev - Q3.rev)} berasal dari AOV (${srp(dq.aov)}); efek volume hanya ${srp(dq.vol)}.`,
    "Pertanyaan halaman ini: pertumbuhan berasal dari jumlah transaksi atau dari nilai per transaksi?"));
  const B = S.bands;
  root.append(story(
    { t: "Volume mendatar sejak September; nilai per transaksi yang naik.", c: "High",
      e: `Transaksi Sep–Des: ${H2M.join(" → ")}. Q4 vs Q3 transaksi ${spct(chg(Q4.trx, Q3.trx))}, AOV ${spct(chg(Q4.aov, Q3.aov))} (${rpS(Q3.aov)} → ${rpS(Q4.aov)}).`,
      i: "Menaikkan harga punya batas. Tanpa tambahan volume, pertumbuhan akan melambat begitu AOV berhenti naik." },
    { t: "Dekomposisi per game berbeda arah: ML tumbuh lewat volume, FF lewat AOV, Roblox kehilangan volume.", c: "High",
      e: `Q4 vs Q3. FF: volume ${srp(S.dec_q4q3.FF.vol)}, AOV ${srp(S.dec_q4q3.FF.aov)}. ML: volume ${srp(S.dec_q4q3.ML.vol)}, AOV ${srp(S.dec_q4q3.ML.aov)}. Roblox: volume ${srp(S.dec_q4q3.RB.vol)}, AOV ${srp(S.dec_q4q3.RB.aov)}.`,
      i: "Tiap game butuh tuas yang berbeda: pasokan untuk FF, menjaga momentum volume ML, dan memperbaiki pola stok Roblox." },
    { t: `Kelas Premium menaikkan AOV tetapi marginnya paling tipis (${pct(B[4].gpm)}) dan paling lambat laku.`, c: "High",
      e: `GPM per kelas: Murah ${pct(B[0].gpm)}, Menengah bawah ${pct(B[1].gpm)}, Menengah ${pct(B[2].gpm)}, Menengah atas ${pct(B[3].gpm)}, Premium ${pct(B[4].gpm)}. Median hari laku Premium ${B[4].dts} hari vs ${B[1].dts} hari untuk Menengah bawah.`,
      i: "Mengejar AOV lewat akun Premium menurunkan GPM dan mengikat modal lebih lama. Kelas Menengah bawah–Menengah memberi kombinasi margin dan kecepatan yang paling seimbang." },
    { t: "Satu transaksi selalu berisi satu akun, jadi 'unit per transaksi' selalu 1.", c: "High",
      e: "Setiap baris data adalah satu akun dengan satu harga jual.", i: "Analisis basket diganti dengan bauran kelas harga." }
  ));

  const trxM = monthlySeries(rs => rs.length);
  const aovM = monthlySeries(rs => (rs.length >= 5 ? rs.reduce((a, t) => a + t.r, 0) / rs.length : null));
  const ts = activeGames().map(g => ({ name: GN[g], short: GC[g], color: GCOL[g], values: cut(trxM[g]) }));
  const as = activeGames().map(g => ({ name: GN[g], short: GC[g], color: GCOL[g], values: cut(aovM[g]) }));
  const lg = ts.map(x => ({ name: x.name, color: x.color, kind: "ln" }));
  root.append(sec("Volume dan nilai transaksi"), grid("g2",
    chartCard({ title: "Transaksi per bulan", sub: "Jumlah akun terjual. " + PARTIAL_NOTE, legend: lg, legendKind: "ln",
      draw: el => Charts.line(el, { labels: TM(), xFmt: mLab, series: ts, yFmt: num, band: bandIdx(), height: 240, tipHeader: l => mLong(l) }),
      table: () => ({ cols: [{ k: "m", label: "Bulan" }, ...ts.map((x, i) => ({ k: "v" + i, label: x.name, num: true, fmt: num }))], rows: TM().map((ym, i) => { const r = { m: mLong(ym) }; ts.forEach((x, k) => r["v" + k] = x.values[i]); return r; }) }) }),
    chartCard({ title: "AOV per bulan", sub: "Nilai rata-rata per transaksi; bulan dengan < 5 transaksi disembunyikan.", legend: lg, legendKind: "ln",
      draw: el => Charts.line(el, { labels: TM(), xFmt: mLab, series: as, yFmt: rpAx, tipFmt: v => rpS(v), yMin: 0, band: bandIdx(), height: 240, tipHeader: l => mLong(l) }),
      table: () => ({ cols: [{ k: "m", label: "Bulan" }, ...as.map((x, i) => ({ k: "v" + i, label: x.name, num: true, fmt: v => (v === null ? "—" : rp(v)) }))], rows: TM().map((ym, i) => { const r = { m: mLong(ym) }; as.forEach((x, k) => r["v" + k] = x.values[i]); return r; }) }) })
  ));

  // dekomposisi dinamis
  const labels = [], vol = [], aovE = [];
  if (P) {
    activeGames().forEach(g => { const d = decompose(P.filter(t => t.g === g), C.filter(t => t.g === g)); if (d) { labels.push(GN[g]); vol.push(d.vol); aovE.push(d.aov); } });
    const d = decompose(P, C); if (d) { labels.push("Total"); vol.push(d.vol); aovE.push(d.aov); }
  }
  const dTot = P ? decompose(P, C) : null;
  root.append(sec("Dekomposisi perubahan revenue"), grid("g2",
    P && labels.length ? chartCard({
      title: "Efek volume vs efek AOV", sub: `${rangeLabel([ST.from, ST.to])} vs ${rangeLabel(prevRange())}. Efek volume = Δtransaksi × AOV lama; efek AOV = ΔAOV × transaksi baru.`,
      legend: [{ name: "Efek volume", color: "var(--s-violet)" }, { name: "Efek AOV", color: "var(--s-yellow)" }],
      draw: el => Charts.bar(el, { horizontal: true, labels, series: [{ name: "Efek volume", color: "var(--s-violet)", values: vol }, { name: "Efek AOV", color: "var(--s-yellow)", values: aovE }], yFmt: rpAx, tipFmt: v => srp(v), labelFmt: v => srp(v), labelWidth: 120, rowH: 50, boldRows: [labels.length - 1] }),
      foot: dTot ? `Total Δ revenue ${srp(dTot.d)} = volume ${srp(dTot.vol)} + AOV ${srp(dTot.aov)}.` : "",
      table: () => ({ cols: [{ k: "l", label: "Game" }, { k: "v", label: "Efek volume", num: true, fmt: srp }, { k: "a", label: "Efek AOV", num: true, fmt: srp }, { k: "t", label: "Δ Revenue", num: true, fmt: srp }], rows: labels.map((l, i) => ({ l, v: vol[i], a: aovE[i], t: vol[i] + aovE[i] })) })
    }) : h("div", { class: "card" }, h("h3", {}, "Efek volume vs efek AOV"), h("p", { class: "csub" }, "Periode terpilih tidak punya periode pembanding dengan panjang yang sama.")),
    (() => {
      const qs = QUARTERS.map(q => TRX.filter(t => qOf(t.ym) === q && gOn(t.g)));
      const sers = D.bands.map((b, k) => ({ name: b, color: OCOL[k], values: qs.map(rs => (rs.length ? rs.filter(t => t.band === k).length / rs.length : 0)) }));
      return chartCard({ title: "Bauran kelas harga per kuartal", sub: "Porsi jumlah transaksi per kelas harga, 2025.", legend: sers.map(x => ({ name: x.name, color: x.color })),
        draw: el => Charts.bar(el, { labels: ["Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025"], series: sers, stacked: true, percent: true, yFmt: v => pct(v, 0), tipFmt: v => pct(v), height: 250, showTotal: false }),
        table: () => ({ cols: [{ k: "c", label: "Kelas" }, ...["Q1", "Q2", "Q3", "Q4"].map((q, i) => ({ k: "q" + i, label: q + " 2025", num: true, fmt: v => pct(v) }))], rows: sers.map(x => { const r = { c: x.name }; x.values.forEach((v, i) => r["q" + i] = v); return r; }) }) });
    })()
  ));

  // tabel kelas harga & histogram
  const A = agg(C);
  const brows = D.bands.map((b, k) => {
    const rs = C.filter(t => t.band === k), a = agg(rs);
    return { c: b, rg: D.band_ranges ? D.band_ranges[k] : "", trx: a.trx, st: A.trx ? a.trx / A.trx : 0, rev: a.rev, sr: A.rev ? a.rev / A.rev : 0, gpm: a.gpm, dts: median(rs.filter(t => t.dts >= 0).map(t => t.dts)), _k: k };
  });
  const cols = [{ k: "c", label: "Kelas harga", sv: r => r._k }];
  if (D.band_ranges) cols.push({ k: "rg", label: "Rentang" });
  cols.push({ k: "trx", label: "Transaksi", num: true, fmt: num }, { k: "st", label: "% trx", num: true, fmt: v => pct(v) }, { k: "rev", label: "Revenue", num: true, fmt: rpS }, { k: "sr", label: "% revenue", num: true, fmt: v => pct(v) }, { k: "gpm", label: "GPM", num: true, fmt: v => pct(v) }, { k: "dts", label: "Median hari laku", num: true, fmt: v => (v === null ? "—" : NF1.format(v)) });
  const vals = C.map(t => t.r);
  const top = quantile(vals, 0.98) || 1;
  const step = (() => { const raw = top / 12, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; })();
  const nb = Math.ceil(top / step);
  const cnt = Array(nb + 1).fill(0);
  vals.forEach(v => cnt[Math.min(nb, Math.floor(v / step))]++);
  const hl = cnt.map((_, i) => (i === nb ? "≥ " + rpAx(nb * step) : rpAx(i * step)));
  root.append(sec("Kelas harga dan distribusi nilai"), grid("g1",
    h("div", { class: "card" }, h("h3", {}, "Kinerja per kelas harga (periode terpilih)"), h("div", { class: "csub" }, PUB ? "Kelas ditentukan dari harga jual asli; rentang rupiah tidak ditampilkan di versi publik." : "Kelas ditentukan dari harga jual per akun."), table({ cols, rows: brows, sort: { k: "c", desc: false } })),
    chartCard({ title: "Distribusi nilai transaksi", sub: `Periode terpilih, ${num(vals.length)} transaksi; median ${rpS(median(vals) || 0)}.`,
      draw: el => Charts.bar(el, { labels: hl, series: [{ name: "Transaksi", color: "var(--o3)", values: cnt }], yFmt: num, height: 250, tipHeader: (l, i) => (i === nb ? l : "Rp " + rpAx(i * step) + " – " + rpAx((i + 1) * step)), barMax: 30 }),
      table: () => ({ cols: [{ k: "b", label: "Rentang mulai" }, { k: "n", label: "Transaksi", num: true, fmt: num }], rows: cnt.map((n, i) => ({ b: hl[i], n })), nosort: true }) })
  ));
}

/* ===================== 4. PERFORMA PRODUK ===================== */
function pageProduk(root) {
  const C = cur(), P = prev(), A = agg(C);
  const sg = S.rb.seg;
  root.append(pageHead(4, "Performa Produk",
    `FF adalah mesin utama (${pct(S.conc.rev_share.FF, 0)} revenue, ${pct(S.conc.gp_share.FF, 0)} laba kotor). Roblox paling tinggi marginnya tetapi paling lambat laku, dan ML tumbuh lagi dengan profil yang lebih sehat.`,
    "Produk dibaca pada dua tingkat: game, lalu subkategori Roblox yang permintaannya mengikuti tren."));
  root.append(story(
    { t: `Roblox: margin tertinggi (GPM Q4 ${pct(Q4.RB.gpm)}) tetapi laku paling lambat (median ${S.dts.RB.med} hari vs ${S.dts.FF.med} hari untuk FF).`, c: "Medium",
      why: "51% baris Roblox tidak punya atribut subkategori",
      e: `Permintaan berpindah mengikuti tren game: Avatar/Blox Fruit/Grow a Garden (Apr–Jul) → On Mic (Sep–Nov) → Fish It (Nov–Des, ${S.rb.fishit_dec} transaksi di Desember). Fish It laku dalam median ${sg["Fish It"].dts} hari dengan AOV ${rpS(sg["Fish It"].aov)}.`,
      i: "Roblox menguntungkan selama stoknya mengikuti tren yang sedang naik. Membeli dalam jumlah besar berisiko stok usang saat tren berganti." },
    { t: `ML berubah profil: dari akun premium bermargin tipis ke akun massal bermargin sehat.`, c: "High",
      e: `AOV ML H1 ${rpS(S.ml.aov_h1)} → H2 ${rpS(S.ml.aov_h2)}; GPM ${pct(S.ml.gpm_h1)} → ${pct(S.ml.gpm_h2)}. Q4 ML ${num(Q3.ML.trx)} → ${num(Q4.ML.trx)} transaksi (${spct(chg(Q4.ML.trx, Q3.ML.trx), 0)}).`,
      i: "ML kini menyumbang laba yang lebih stabil. Transaksi besar ML tetap perlu diawasi karena 10 transaksi teratas = " + pct(S.conc.ML.top10, 0) + " revenue ML." },
    { t: `Kanal ${MJ} tumbuh cepat dengan margin jauh di bawah kanal langsung.`, c: "High", kind: "risk",
      e: `Q4: kanal mitra ${pct(K.q4.mitra_share)} revenue, GPM ${pct(K.q4.mitra_gpm)} vs kanal langsung ${pct(K.q4.Langsung.gpm)}. Porsi mitra per game Q4: FF ${pct(K.mitra_share_q4_game.FF, 0)}, ML ${pct(K.mitra_share_q4_game.ML, 0)}, Roblox ${pct(K.mitra_share_q4_game.RB, 0)}.`,
      i: "Detail dan opsi keputusannya ada di halaman 9." },
    { t: "Akun bertanda FS laku jauh lebih lambat, dan di Roblox marginnya lebih rendah.", c: "Medium", hyp: true, kind: "hyp",
      e: `FF: median ${S.fs.FF.true.dts} hari (FS) vs ${S.fs.FF.false.dts} hari. Roblox: GPM ${pct(S.fs.RB.true.gpm)} (FS) vs ${pct(S.fs.RB.false.gpm)}, median ${S.fs.RB.true.dts} vs ${S.fs.RB.false.dts} hari.`,
      i: "Pola ini cocok dengan FS sebagai label obral untuk stok lambat. Perlu konfirmasi arti label FS dari tim." }
  ));

  // matriks performa
  const segRows = [];
  const mk = (label, cRows, pRows, risk, sub) => {
    const a = agg(cRows), b = pRows ? agg(pRows) : null;
    const d = b && b.rev ? chg(a.rev, b.rev) : null;
    const sh = A.rev ? a.rev / A.rev : 0;
    const isNew = b && !b.trx && a.trx > 0;
    const cls = sh >= 0.3 ? "Core" : isNew ? "Baru" : d !== null && d <= -0.1 ? "Declining" : sh < 0.05 ? "Long-tail" : d !== null && d >= 0.2 ? "Growth" : "Stabil";
    return { p: label, rev: a.rev, trx: a.trx, d, sh, gpm: a.gpm, dts: median(cRows.filter(t => t.dts >= 0).map(t => t.dts)), risk, cls, _cls: sub ? "sub" : null, _rows: cRows };
  };
  const RISK = ["Ketergantungan tinggi; pasokan ketat", "Transaksi besar terkonsentrasi", "Stok lambat; permintaan ikut tren"];
  const SRISK = ["Permintaan memudar sejak Juli", "Tren baru, belum teruji lama", `Stok Ready menumpuk (${S.ready.rb_onmic} akun)`, "Volume kecil", "Atribut tidak dicatat"];
  const rows = [];
  activeGames().forEach(g => {
    rows.push(mk(GN[g], C.filter(t => t.g === g), P ? P.filter(t => t.g === g) : null, RISK[g]));
    if (g === 2) D.segs.forEach((sname, k) => { const r = mk("Roblox · " + sname, C.filter(t => t.g === 2 && t.s === k), P ? P.filter(t => t.g === 2 && t.s === k) : null, SRISK[k], true); if (r.trx) rows.push(r); });
  });
  const trendCell = r => {
    const end = mi(ST.to);
    const ms = MONTHS.slice(Math.max(0, end - 5), end + 1);
    const vals = ms.map(ym => r._rows === null ? 0 : TRX.filter(t => t.ym === ym && (r.p.startsWith("Roblox · ") ? t.g === 2 && D.segs[t.s] === r.p.slice(9) : GN[t.g] === r.p)).reduce((a, t) => a + t.r, 0));
    return Charts.spark(vals, "var(--s-ff)", 90, 22).outerHTML;
  };
  root.append(sec("Matriks performa produk"), h("div", { class: "card" },
    h("div", { class: "csub", html: "Klasifikasi: <b>Core</b> kontribusi ≥ 30%; <b>Baru</b> belum ada di periode pembanding; <b>Declining</b> revenue turun ≥ 10%; <b>Long-tail</b> kontribusi < 5%; <b>Growth</b> naik ≥ 20%; selain itu <b>Stabil</b>. Margin dihitung dari transaksi dengan modal tercatat." }),
    table({ cols: [{ k: "p", label: "Produk" }, { k: "rev", label: "Revenue", num: true, fmt: rpS }, { k: "trx", label: "Trx", num: true, fmt: num }, { k: "d", label: "Pertumbuhan", num: true, fmt: v => spct(v), cls: r => (r.d > 0 ? "up-t" : r.d < 0 ? "down-t" : "") },
      { k: "sh", label: "Kontribusi", num: true, fmt: v => pct(v) }, { k: "gpm", label: "GPM", num: true, fmt: v => pct(v) }, { k: "dts", label: "Median hari laku", num: true, fmt: v => (v === null ? "—" : NF1.format(v)) },
      { k: "tr", label: "Tren 6 bln", html: trendCell, nosort: true }, { k: "cls", label: "Klasifikasi" }, { k: "risk", label: "Risiko utama" }], rows })));

  // kuadran & segmen roblox
  const pts = [];
  if (P) {
    activeGames().forEach(g => {
      const a = agg(C.filter(t => t.g === g)), b = agg(P.filter(t => t.g === g));
      if (a.trx && b.trx) pts.push({ x: chg(a.rev, b.rev), y: a.gpm, size: a.rev, label: GN[g], color: GCOL[g], tip: [{ label: "Pertumbuhan revenue", value: spct(chg(a.rev, b.rev)) }, { label: "GPM", value: pct(a.gpm) }, { label: "Revenue", value: rpS(a.rev) }] });
    });
    if (gOn(2)) D.segs.forEach((sname, k) => {
      if (k === 4) return;
      const a = agg(C.filter(t => t.g === 2 && t.s === k)), b = agg(P.filter(t => t.g === 2 && t.s === k));
      if (a.trx >= 5 && b.trx >= 5) pts.push({ x: chg(a.rev, b.rev), y: a.gpm, size: a.rev, label: "RB · " + sname, color: "var(--s-other)", faint: true, tip: [{ label: "Pertumbuhan revenue", value: spct(chg(a.rev, b.rev)) }, { label: "GPM", value: pct(a.gpm) }, { label: "Revenue", value: rpS(a.rev) }] });
    });
  }
  const segM = D.segs.map((_, k) => MONTHS.map(ym => TRX.filter(t => t.g === 2 && t.s === k && t.ym === ym).length));
  const sser = D.segs.map((n, k) => ({ name: n, color: SEGCOL[k], values: segM[k] }));
  const fromRb = mi(202504);
  root.append(sec("Portofolio"), grid("g2",
    pts.length ? chartCard({ title: "Kuadran portofolio", sub: "Sumbu X: pertumbuhan revenue vs periode pembanding. Sumbu Y: GPM. Ukuran = revenue. Abu-abu = subkategori Roblox (≥ 5 transaksi di kedua periode).",
      draw: el => Charts.scatter(el, { points: pts, xFmt: v => spct(v, 0), yFmt: v => pct(v, 0), xLabel: "Pertumbuhan revenue", yLabel: "GPM", xRef: 0, yRef: A.gpm, bubble: true, height: 300, quad: ["Margin tinggi · turun", "Margin tinggi · tumbuh", "Margin rendah · turun", "Margin rendah · tumbuh"] }),
      table: () => ({ cols: [{ k: "label", label: "Produk" }, { k: "x", label: "Pertumbuhan", num: true, fmt: v => spct(v) }, { k: "y", label: "GPM", num: true, fmt: v => pct(v) }, { k: "size", label: "Revenue", num: true, fmt: rpS }], rows: pts }) })
      : h("div", { class: "card" }, h("h3", {}, "Kuadran portofolio"), h("p", { class: "csub" }, "Butuh periode pembanding.")),
    gOn(2) ? chartCard({ title: "Roblox: transaksi per subkategori", sub: "Subkategori dibaca dari kolom Jenis Game, Ket. Singkat, dan STOCK/JASA POST.", legend: sser.map(x => ({ name: x.name, color: x.color })),
      draw: el => Charts.bar(el, { labels: MONTHS.slice(fromRb), xFmt: mLab, series: sser.map(x => ({ ...x, values: x.values.slice(fromRb) })), stacked: true, yFmt: num, height: 270, band: [Math.max(0, mi(ST.from) - fromRb), mi(ST.to) - fromRb], tipHeader: l => mLong(l) }),
      table: () => ({ cols: [{ k: "m", label: "Bulan" }, ...sser.map((x, i) => ({ k: "v" + i, label: x.name, num: true, fmt: num }))], rows: MONTHS.slice(fromRb).map((ym, i) => { const r = { m: mLong(ym) }; sser.forEach((x, k) => r["v" + k] = x.values[i + fromRb]); return r; }) }) })
      : h("div", { class: "card" }, h("h3", {}, "Roblox: transaksi per subkategori"), h("p", { class: "csub" }, "Aktifkan Roblox di filter game."))
  ));

  // kanal & FS
  const krows = [0, 1, 2].map(k => { const a = agg(C.filter(t => t.k === k)); return { k: KNAME[k], trx: a.trx, rev: a.rev, sh: A.rev ? a.rev / A.rev : 0, gpm: a.gpm }; });
  const frows = [];
  activeGames().forEach(g => [1, 0].forEach(f => { const rs = C.filter(t => t.g === g && t.fs === f), a = agg(rs); if (a.trx) frows.push({ g: GN[g], f: f ? "FS" : "Non-FS", trx: a.trx, gpm: a.gpm, aov: a.aov, dts: median(rs.filter(t => t.dts >= 0).map(t => t.dts)) }); }));
  root.append(sec("Kanal penjualan dan label FS"), grid("g2",
    h("div", { class: "card" }, h("h3", {}, "Kanal penjualan (periode terpilih)"), h("div", { class: "csub" }, (D.mitra_code ? D.mitra_code + " = mitra re-seller." : "Mitra = re-seller rekanan.") + " 'Dijualkan' = akun dijual lewat mitra; 'dibeli mitra' = mitra membeli akun."),
      table({ cols: [{ k: "k", label: "Kanal" }, { k: "trx", label: "Trx", num: true, fmt: num }, { k: "rev", label: "Revenue", num: true, fmt: rpS }, { k: "sh", label: "Kontribusi", num: true, fmt: v => pct(v) }, { k: "gpm", label: "GPM", num: true, fmt: v => pct(v) }], rows: krows })),
    h("div", { class: "card" }, h("h3", {}, "Akun berlabel FS vs lainnya (periode terpilih)"), h("div", { class: "csub" }, "Arti label FS belum dikonfirmasi."),
      table({ cols: [{ k: "g", label: "Game" }, { k: "f", label: "Label" }, { k: "trx", label: "Trx", num: true, fmt: num }, { k: "aov", label: "AOV", num: true, fmt: rpS }, { k: "gpm", label: "GPM", num: true, fmt: v => pct(v) }, { k: "dts", label: "Median hari laku", num: true, fmt: v => (v === null ? "—" : NF1.format(v)) }], rows: frows }))
  ));
}

/* ===================== 5. WAKTU, TREN & ANOMALI ===================== */
function pageWaktu(root) {
  const C = cur();
  root.append(pageHead(5, "Waktu, Tren & Anomali",
    "Tidak ada pola hari tertentu. Perubahan besar terjadi pada beberapa titik struktural, dan sebagian besar lonjakan harian dijelaskan oleh satu transaksi bernilai besar atau input penjualan yang dikumpulkan di satu tanggal.",
    "Halaman ini memisahkan signal (pola konsisten dan material) dari noise (fluktuasi kecil tanpa implikasi)."));
  root.append(story(
    { t: "Weekday vs weekend: noise, bukan signal.", c: "High", e: `Mar–Des 2025 rata-rata ${NF1.format(S.weekend.we)} transaksi per hari di akhir pekan vs ${NF1.format(S.weekend.wd)} di hari kerja.`, i: "Jadwal admin dan promosi tidak perlu dibedakan menurut hari. Jam transaksi tidak tercatat, jadi peak hour tidak bisa dianalisis." },
    { t: "Revenue mingguan makin stabil.", c: "High", e: `Koefisien variasi revenue mingguan ${NF1.format(S.weekly_cv.all * 100)}% (Mar–Des 2025) turun ke ${NF1.format(S.weekly_cv.last13 * 100)}% pada 13 minggu terakhir.`, i: "Bisnis sudah keluar dari fase awal yang fluktuatif, sehingga penyimpangan mingguan > 20% layak diperiksa." },
    { t: "Lonjakan Desember: signal sedang; perlambatan awal Januari: belum bisa disimpulkan.", c: "Low", kind: "hyp",
      e: `Desember naik ${pct(chg(S.dec.rev, S.nov.rev))} dari November dengan kenaikan merata pada nilai transaksi. 1–9 Jan 2026: ${NF1.format(S.jan_pace.jan)} transaksi/hari vs ${NF1.format(S.jan_pace.dec)} di Desember.`,
      i: "Januari baru 9 hari dan mencakup libur tahun baru; bisa juga ada penjualan yang belum diinput. Pantau sampai akhir Januari sebelum mengambil keputusan." }
  ));

  // harian + median 28 hari
  const days = [];
  for (let d = new Date(2025, 2, 1); d <= new Date(2026, 0, 9); d.setDate(d.getDate() + 1)) days.push(d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate());
  const map = new Map();
  TRX.forEach(t => { if (gOn(t.g)) map.set(t.d, (map.get(t.d) || 0) + t.r); });
  const dv = days.map(d => map.get(d) || 0);
  const med = dv.map((_, i) => { const w = dv.slice(Math.max(0, i - 14), Math.min(dv.length, i + 14)); return w.length >= 14 ? median(w) : null; });
  const b0 = days.findIndex(d => Math.floor(d / 100) >= ST.from), b1 = days.length - 1 - [...days].reverse().findIndex(d => Math.floor(d / 100) <= ST.to);
  const allG = ST.games.every(Boolean);
  const markers = allG ? D.anomalies.map(a => ({ i: days.indexOf(a.tgl), v: a.actual })).filter(m => m.i >= 0) : [];
  root.append(sec("Pola harian"), chartCard({
    title: "Revenue harian dan median bergerak 28 hari", sub: "Lingkaran merah = anomali (|z robust| > 3,5 terhadap median 28 hari), hanya tampil saat semua game dipilih.",
    legend: [{ name: "Revenue harian", color: "var(--s-ff)", kind: "ln" }, { name: "Median 28 hari", color: "var(--s-line2)", kind: "ln" }, { name: "Anomali", color: "var(--down)", kind: "ln" }],
    draw: el => Charts.line(el, { labels: days, xFmt: d => dt(d).slice(0, 5), series: [{ name: "Revenue harian", color: "var(--s-ff)", values: dv, width: 1.2 }, { name: "Median 28 hari", color: "var(--s-line2)", values: med }], yFmt: rpAx, tipFmt: v => rpS(v), dots: false, band: b0 >= 0 && b1 >= b0 ? [b0, b1] : null, markers, height: 270, tipHeader: d => dt(d) }),
    table: () => ({ cols: [{ k: "d", label: "Tanggal", fmt: dt }, { k: "v", label: "Revenue", num: true, fmt: rp }, { k: "m", label: "Median 28 hari", num: true, fmt: v => (v === null ? "—" : rp(v)) }], rows: days.map((d, i) => ({ d, v: dv[i], m: med[i] })), sort: { k: "d", desc: true } })
  }));

  // hari dalam seminggu (dinamis)
  const nd = Array(7).fill(0), nt = Array(7).fill(0), nr = Array(7).fill(0);
  const startD = new Date(Math.floor(ST.from / 100), ST.from % 100 - 1, 1);
  const endD = new Date(Math.floor(ST.to / 100), ST.to % 100, 0);
  const snap = new Date(2026, 0, 9);
  for (let d = new Date(startD); d <= endD && d <= snap; d.setDate(d.getDate() + 1)) nd[(d.getDay() + 6) % 7]++;
  C.forEach(t => { const d = new Date(Math.floor(t.d / 10000), Math.floor(t.d / 100) % 100 - 1, t.d % 100); const w = (d.getDay() + 6) % 7; nt[w]++; nr[w] += t.r; });
  const DOW = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  const tpd = nt.map((n, i) => (nd[i] ? n / nd[i] : 0));
  // rentang noise: 2 x standar error rata-rata per hari-minggu
  const dayCnt = new Map();
  C.forEach(t => dayCnt.set(t.d, (dayCnt.get(t.d) || 0) + 1));
  const daily = [];
  for (let d = new Date(startD); d <= endD && d <= snap; d.setDate(d.getDate() + 1)) daily.push(dayCnt.get(d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()) || 0);
  const mean = daily.reduce((a, b) => a + b, 0) / (daily.length || 1);
  const sdv = Math.sqrt(daily.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, daily.length - 1));
  const se2 = (2 * sdv) / Math.sqrt(Math.max(1, daily.length / 7));
  root.append(grid("g2",
    chartCard({ title: "Rata-rata transaksi per hari", sub: "Periode terpilih, dinormalisasi dengan jumlah hari kalender.", foot: `Rata-rata semua hari ${NF1.format(mean)} transaksi. Selisih antar-hari di bawah ±${NF1.format(se2)} (2 × standar error per hari-minggu) masih dalam rentang noise.`,
      draw: el => Charts.bar(el, { labels: DOW, series: [{ name: "Transaksi/hari", color: "var(--o3)", values: tpd }], yFmt: v => NF1.format(v), height: 230, valueLabels: "all", labelFmt: v => NF1.format(v), tipExtra: i => [{ label: "Revenue/hari", value: rpS(nd[i] ? nr[i] / nd[i] : 0) }] }),
      table: () => ({ cols: [{ k: "d", label: "Hari" }, { k: "t", label: "Transaksi/hari", num: true, fmt: v => NF1.format(v) }, { k: "r", label: "Revenue/hari", num: true, fmt: rpS }], rows: DOW.map((d, i) => ({ d, t: tpd[i], r: nd[i] ? nr[i] / nd[i] : 0 })), nosort: true }) }),
    h("div", { class: "card" }, h("h3", {}, "Titik perubahan struktural"), h("div", { class: "csub" }, "Peristiwa yang mengubah pola data, bukan fluktuasi biasa."),
      table({ nosort: true, cols: [{ k: "w", label: "Waktu" }, { k: "e", label: "Peristiwa" }, { k: "x", label: "Dampak pada analisis", wrap: true }], rows: [
        { w: "Feb 2025", e: "FF mulai dicatat", x: "Volume melonjak; FF jadi lini terbesar sejak Mar 2025." },
        { w: "Apr 2025", e: "Roblox mulai dijual", x: "Lini baru dengan margin tertinggi." },
        { w: "Jul 2025", e: "Nama admin mulai dicatat", x: "Analisis admin hanya valid Jul 2025 ke atas." },
        { w: "Jul 2025", e: `Pembelian borongan Roblox (${S.rb.batch_n} akun)`, x: `Puncak Roblox Agustus: ${S.rb.batch_aug} dari ${S.rb.aug_trx} transaksi berasal dari batch ini.` },
        { w: "Sep 2025", e: "Kanal " + MJ + " mulai", x: `Porsi revenue mitra naik ke ${pct(K.q4.mitra_share)} di Q4.` },
        { w: "Okt 2025", e: "Kontak penjual berhenti dicatat", x: "Analisis supplier hanya bisa sampai Sep 2025." },
        { w: "Des 2025", e: "AOV melonjak", x: `AOV ${rpS(S.nov.aov)} → ${rpS(S.dec.aov)}.` }] }))
  ));

  root.append(sec("Tabel anomali"), h("div", { class: "card" },
    h("div", { class: "csub" }, "Hari dengan revenue menyimpang > 3,5 deviasi robust dari median 28 hari (semua game). Expected = median 28 hari."),
    table({ cols: [{ k: "tgl", label: "Tanggal", fmt: dt }, { k: "metrik", label: "Metrik" }, { k: "expected", label: "Expected", num: true, fmt: rpS }, { k: "actual", label: "Actual", num: true, fmt: rpS }, { k: "dev", label: "Deviasi", num: true, fmt: v => spct(v, 0) }, { k: "trx", label: "Trx", num: true, fmt: num }, { k: "expl", label: "Kemungkinan penjelasan", wrap: true }, { k: "conf", label: "Confidence" }], rows: D.anomalies, sort: { k: "tgl", desc: false } }),
    h("div", { class: "note" }, "Lonjakan Maret 2025 terjadi saat volume harian masih kecil, sehingga satu akun mahal sudah cukup membuat hari itu tampak ekstrem.")));
}

/* ===================== 6. OPERASIONAL & STOK ===================== */
function pageOperasional(root) {
  const C = cur();
  root.append(pageHead(6, "Operasional & Stok",
    "FF dan ML hampir selalu habis terjual dalam hitungan hari. Hambatan operasional ada di stok Roblox, pasokan akun, ketergantungan admin, dan disiplin pencatatan.",
    "Stok, kecepatan jual, kebocoran, beban admin, dan sumber pasokan."));
  const ready = STK.filter(x => x.st === 1 && gOn(x.g));
  const rm = ready.reduce((a, x) => a + Math.max(0, x.m), 0), rl = ready.reduce((a, x) => a + Math.max(0, x.j), 0);
  const dts = C.filter(t => t.dts >= 0).map(t => t.dts);
  root.append(grid("g-kpi",
    kpi("Stok Ready", num(ready.length) + " akun", null, "snapshot 09/01/2026"),
    kpi("Modal tertahan", rpS(rm), null, "harga beli akun yang belum laku"),
    kpi("Nilai jual daftar", rpS(rl), null, `${ready.filter(x => x.j < 0).length} akun belum diberi harga`),
    kpi("Median hari sampai laku", dts.length ? NF1.format(median(dts)) + " hari" : "—", null, "periode terpilih"),
    kpi("Laku ≤ 7 hari", dts.length ? pct(dts.filter(x => x <= 7).length / dts.length, 0) : "—", null, "porsi transaksi periode terpilih")
  ));
  root.append(story(
    { t: "FF dan ML hampir selalu habis; volume kemungkinan dibatasi pasokan, bukan permintaan.", c: "Medium", hyp: true, kind: "hyp",
      e: `Sell-through kohort masuk Feb–Nov 2025: FF ${pct(S.sellthrough.FF.min, 0)}–${pct(S.sellthrough.FF.max, 0)}, ML 96–100% (kecuali kohort Juli yang hanya 5 akun). Median laku ${S.dts.FF.med} hari (FF) dan ${S.dts.ML.med} hari (ML). Akun FF masuk Desember ${S.stockin.FF["2025-12"]} vs terjual ${S.dec.FF.trx}.`,
      i: "Bila benar, tambahan pasokan FF/ML langsung menjadi tambahan penjualan. Validasi: catat calon pembeli yang tidak terlayani karena stok kosong." },
    { t: `Stok Roblox lambat dan menumpuk: ${pct(S.ready.rb_share_n, 0)} stok Ready adalah Roblox.`, c: "High", kind: "risk",
      e: `${num(S.ready.RB.n)} akun Roblox Ready (modal ${rpS(S.ready.RB.modal)}); ${S.ready.RB.gt90} akun > 90 hari, ${S.ready.RB.no_date} tanpa tanggal masuk, ${S.ready.rb_onmic} akun On Mic. Hanya ${pct(S.dts.RB.le7, 0)} transaksi Roblox laku ≤ 7 hari (FF ${pct(S.dts.FF.le7, 0)}).`,
      i: "Modal tertahan di Roblox paling berisiko usang karena permintaan Roblox mengikuti tren yang cepat berganti." },
    { t: `Beban kerja terkonsentrasi pada dua admin, dengan rotasi tinggi.`, c: "Medium", why: "Kolom Notes ditafsirkan sebagai admin yang menangani penjualan",
      e: `Jul–Des 2025: ${S.admin.top1} ${pct(S.admin.top1_rev, 0)} revenue, dua admin teratas ${pct(S.admin.top2_rev, 0)}; Q4 ${pct(S.admin.top2_trx_q4, 0)} transaksi. Ada ${S.admin.n} nama admin dalam 6 bulan.`,
      i: "Bila salah satu admin berhalangan, kapasitas penjualan langsung turun. Perbedaan hari laku antar-admin tidak bisa dibaca sebagai kinerja karena jenis stok yang ditangani berbeda." },
    { t: `Kebocoran kecil, tetapi menunjukkan celah proses.`, c: "High",
      e: `${S.loss.n} akun dengan modal ${rpS(S.loss.modal)} keluar tanpa pendapatan (${pct(S.loss.share_gp)} dari laba kotor), semuanya masuk stok ${dt(S.loss.first_entry)}–${dt(S.loss.last_entry)}. Ada ${S.profit_overwrite} profit yang ditimpa manual. Tidak ditemukan evidence fraud.`,
      i: "Nilai kecil, tetapi tanpa alasan tercatat sulit dibedakan antara gagal login, salah kirim, atau penyimpangan." }
  ));

  // masuk vs terjual
  const inM = MONTHS.map(ym => STK.filter(x => x.eym === ym && gOn(x.g)).length);
  const outM = MONTHS.map(ym => TRX.filter(t => t.ym === ym && gOn(t.g)).length);
  root.append(sec("Arus stok"), grid("g1",
    chartCard({ title: "Akun masuk vs akun terjual per bulan", sub: "Masuk = tanggal masuk stok; terjual = tanggal jual. Akun tanpa tanggal masuk tidak terhitung (Roblox " + S.ready.RB.no_date + " akun Ready dan lainnya). " + PARTIAL_NOTE,
      legend: [{ name: "Akun masuk", color: "var(--s-violet)", kind: "ln" }, { name: "Akun terjual", color: "var(--s-ff)", kind: "ln" }], legendKind: "ln",
      draw: el => Charts.line(el, { labels: TM(), xFmt: mLab, series: [{ name: "Akun masuk", color: "var(--s-violet)", values: cut(inM) }, { name: "Akun terjual", color: "var(--s-ff)", values: cut(outM) }], yFmt: num, band: bandIdx(), height: 250, tipHeader: l => mLong(l), tipExtra: i => [{ label: "Selisih", value: (inM[i] - outM[i] > 0 ? "+" : "") + num(inM[i] - outM[i]) }] }),
      table: () => ({ cols: [{ k: "m", label: "Bulan" }, { k: "i", label: "Masuk", num: true, fmt: num }, { k: "o", label: "Terjual", num: true, fmt: num }, { k: "d", label: "Selisih", num: true, fmt: v => (v > 0 ? "+" : "") + num(v) }], rows: MONTHS.map((ym, i) => ({ m: mLong(ym), i: inM[i], o: outM[i], d: inM[i] - outM[i] })), nosort: true }) }),
    (() => {
      // heatmap sell-through
      const ms = MONTHS.slice(mi(202502));
      const t = h("table", { class: "t heat" });
      t.appendChild(h("thead", {}, h("tr", {}, h("th", {}, "Game"), ...ms.map(m => h("th", { class: "num" }, mLab(m))))));
      const tb = h("tbody");
      activeGames().forEach(g => {
        const tr = h("tr", {}, h("td", {}, GC[g]));
        ms.forEach(m => {
          const c = STK.filter(x => x.g === g && x.eym === m);
          const sold = c.filter(x => x.st === 0).length;
          const v = c.length ? sold / c.length : null;
          const td = h("td", { class: "cell", title: c.length ? `${GN[g]} · masuk ${mLong(m)}: ${sold} dari ${c.length} terjual` : "tidak ada akun masuk" });
          if (v !== null) {
            td.textContent = pct(v, 0);
            td.style.background = `color-mix(in srgb, var(--o3) ${Math.round(8 + v * 50)}%, transparent)`;
          } else td.textContent = "·";
          tr.appendChild(td);
        });
        tb.appendChild(tr);
      });
      t.appendChild(tb);
      return h("div", { class: "card" }, h("h3", {}, "Sell-through per kohort masuk"), h("div", { class: "csub" }, "Porsi akun yang sudah terjual (dengan pendapatan) per bulan masuk, per 09/01/2026. Arahkan kursor ke sel untuk jumlahnya."), h("div", { class: "tw" }, t),
        h("div", { class: "note" }, "Kohort Des 2025–Jan 2026 wajar masih rendah karena baru masuk."));
    })()
  ));

  // distribusi hari laku & umur stok
  const BK = [[0, 1, "0–1"], [2, 3, "2–3"], [4, 7, "4–7"], [8, 14, "8–14"], [15, 30, "15–30"], [31, 60, "31–60"], [61, 90, "61–90"], [91, 1e9, "> 90"]];
  const dser = activeGames().map(g => { const rs = C.filter(t => t.g === g && t.dts >= 0); return { name: GN[g], color: GCOL[g], values: BK.map(([a, b]) => (rs.length ? rs.filter(t => t.dts >= a && t.dts <= b).length / rs.length : 0)), n: rs.length }; });
  const AG = [[0, 30, "0–30 hari"], [31, 60, "31–60 hari"], [61, 90, "61–90 hari"], [91, 180, "91–180 hari"], [181, 1e9, "> 180 hari"]];
  const snapD = new Date(2026, 0, 9);
  const age = x => (x.e > 0 ? Math.round((snapD - new Date(Math.floor(x.e / 10000), Math.floor(x.e / 100) % 100 - 1, x.e % 100)) / 864e5) : null);
  const ag = activeGames();
  const aser = AG.map(([a, b, l], k) => ({ name: l, color: OCOL[k], values: ag.map(g => ready.filter(x => x.g === g && age(x) !== null && age(x) >= a && age(x) <= b).length) }));
  aser.push({ name: "Tanpa tanggal masuk", color: "var(--s-other)", values: ag.map(g => ready.filter(x => x.g === g && x.e < 0).length) });
  const modalOf = (g, f) => ready.filter(x => x.g === g && f(x)).reduce((a, x) => a + Math.max(0, x.m), 0);
  root.append(sec("Kecepatan jual dan umur stok"), grid("g2",
    chartCard({ title: "Berapa lama akun laku", sub: "Porsi transaksi per rentang hari (tanggal jual − tanggal masuk), periode terpilih.", legend: dser.map(x => ({ name: `${x.name} (n=${num(x.n)})`, color: x.color })),
      draw: el => Charts.bar(el, { labels: BK.map(b => b[2]), series: dser, yFmt: v => pct(v, 0), tipFmt: v => pct(v), height: 250, tipHeader: l => l + " hari" }),
      table: () => ({ cols: [{ k: "b", label: "Hari" }, ...dser.map((x, i) => ({ k: "v" + i, label: x.name, num: true, fmt: v => pct(v) }))], rows: BK.map((b, j) => { const r = { b: b[2] }; dser.forEach((x, i) => r["v" + i] = x.values[j]); return r; }), nosort: true }) }),
    chartCard({ title: "Umur stok Ready per 09/01/2026", sub: "Jumlah akun per umur sejak tanggal masuk. Tidak dipengaruhi filter periode.", legend: aser.map(x => ({ name: x.name, color: x.color })),
      draw: el => Charts.bar(el, { horizontal: true, labels: ag.map(g => GN[g]), series: aser, stacked: true, yFmt: num, labelWidth: 120, rowH: 44, tipExtra: i => [{ label: "Modal tertahan", value: rpS(modalOf(ag[i], () => true)) }] }),
      table: () => ({ cols: [{ k: "b", label: "Umur" }, ...ag.map((g, i) => ({ k: "v" + i, label: GN[g], num: true, fmt: num }))], rows: aser.map(x => { const r = { b: x.name }; x.values.forEach((v, i) => r["v" + i] = v); return r; }), nosort: true }) })
  ));

  // admin
  const H2r = C.filter(t => t.ym >= 202507 && t.ym <= 202512);
  const arows = D.admins.map((n, i) => {
    const rs = H2r.filter(t => t.a === i), a = agg(rs);
    const ms = [...new Set(rs.map(t => t.ym))].sort();
    return { n, trx: a.trx, sh: H2r.length ? a.trx / H2r.length : 0, rev: a.rev, gpm: a.gpm, act: ms.length ? (ms.length === 1 ? mLab(ms[0]) : mLab(ms[0]) + " – " + mLab(ms[ms.length - 1])) : "—" };
  }).filter(r => r.trx);
  const unk = H2r.filter(t => t.a === -1).length;
  root.append(sec("Admin penjualan (Jul–Des 2025)"), H2r.length ? grid("g2",
    chartCard({ title: "Porsi transaksi per admin", sub: `Periode terpilih ∩ Jul–Des 2025. ${unk ? num(unk) + " transaksi tanpa nama admin." : ""}`,
      draw: el => Charts.bar(el, { horizontal: true, labels: arows.map(r => r.n), series: [{ name: "Porsi transaksi", color: "var(--o3)", values: arows.map(r => r.sh) }], yFmt: v => pct(v, 0), labelFmt: v => pct(v, 1), labelWidth: 110, rowH: 28, tipExtra: i => [{ label: "Transaksi", value: num(arows[i].trx) }, { label: "Revenue", value: rpS(arows[i].rev) }] }),
      table: () => ({ cols: [{ k: "n", label: "Admin" }, { k: "trx", label: "Trx", num: true, fmt: num }, { k: "sh", label: "Porsi", num: true, fmt: v => pct(v) }], rows: arows }) }),
    h("div", { class: "card" }, h("h3", {}, "Ringkasan per admin"), h("div", { class: "csub" }, "GPM dan hari laku dipengaruhi jenis stok yang ditangani; jangan dibaca sebagai peringkat kinerja."),
      table({ cols: [{ k: "n", label: "Admin" }, { k: "trx", label: "Trx", num: true, fmt: num }, { k: "rev", label: "Revenue", num: true, fmt: rpS }, { k: "gpm", label: "GPM", num: true, fmt: v => pct(v) }, { k: "act", label: "Aktif" }], rows: arows, sort: { k: "trx", desc: true } }))
  ) : h("div", { class: "card" }, h("p", { class: "csub" }, "Nama admin baru dicatat sejak Juli 2025. Pilih periode yang mencakup Jul–Des 2025.")));

  // kebocoran
  const lrows = D.loss.filter(x => gOn(GC.indexOf(x.game)));
  root.append(sec("Kebocoran: akun keluar tanpa pendapatan"), grid("g2",
    h("div", { class: "card" }, h("h3", {}, `${num(lrows.length)} akun · modal ${rpS(lrows.reduce((a, x) => a + x.modal, 0))}`), h("div", { class: "csub" }, "Status Sold dengan harga jual 0 (bukan transaksi mitra) atau status '-'. Alasan dikelompokkan dari catatan bebas."),
      table({ cols: [{ k: "kode", label: "Kode" }, { k: "game", label: "Game" }, { k: "masuk", label: "Masuk", fmt: dt }, { k: "modal", label: "Modal", num: true, fmt: rp }, { k: "alasan", label: "Alasan" }], rows: lrows, sort: { k: "modal", desc: true } })),
    (() => {
      const sup = STK.filter(x => gOn(x.g));
      const ms = MONTHS.slice(mi(202411), mi(202601) + 1);
      const cov = ms.map(m => { const c = sup.filter(x => x.eym === m); return c.length ? c.filter(x => x.sup >= 0).length / c.length : null; });
      return h("div", { class: "card" },
        h("h3", {}, "Sumber pasokan (penjual akun)"),
        h("div", { class: "csub", html: `${num(S.sup.n)} penjual tercatat; ${num(S.sup.repeat)} di antaranya menjual lebih dari sekali dan menyumbang ${pct(S.sup.repeat_share)} akun. 10 penjual teratas hanya ${pct(S.sup.top10)} akun (maksimum ${S.sup.max} akun per penjual); ${S.sup.cross} penjual memasok lebih dari satu game. GPM akun dari penjual berulang ${pct(S.sup.gpm_rep)} vs sekali jual ${pct(S.sup.gpm_one)}: tidak berbeda berarti. ${conf("High")}` }),
        (() => { const el = h("div", { class: "chart" }); requestAnimationFrame(() => Charts.bar(el, { labels: ms, xFmt: mLab, series: [{ name: "Akun dengan kontak penjual", color: "var(--o3)", values: cov.map(v => v || 0) }], yFmt: v => pct(v, 0), percent: true, height: 200, tipHeader: l => "Masuk " + mLong(l) })); DRAWERS.push(() => el.isConnected && Charts.bar(el, { labels: ms, xFmt: mLab, series: [{ name: "Akun dengan kontak penjual", color: "var(--o3)", values: cov.map(v => v || 0) }], yFmt: v => pct(v, 0), percent: true, height: 200, tipHeader: l => "Masuk " + mLong(l) })); return el; })(),
        h("div", { class: "note", html: `Porsi akun yang punya kontak penjual per bulan masuk. Sejak Oktober 2025 tidak ada lagi yang tercatat. Selain itu ${num(S.resale.accounts)} akun tercatat dibeli kembali lalu dijual ulang (ID game sama).` }));
    })()
  ));
}
