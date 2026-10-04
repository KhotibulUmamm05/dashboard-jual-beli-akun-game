"""
Tahap 2 - Hitung metrik & siapkan data dashboard.

Input : data/internal/clean_all.csv (hasil 01_clean.py)
Output: data/internal/dashboard_internal.json  -> angka asli, nama asli (tidak di-commit)
        data/public/dashboard_public.json      -> versi publik yang disamarkan

Penyamaran versi publik:
  - nama perusahaan -> "PT XYZ", nama admin -> "Admin A", "Admin B", ...
  - nilai rupiah tiap baris dikalikan faktor rahasia k x (1 + e), e acak kecil (+-4%) yang sama
    untuk Modal dan Jual pada baris itu; k dan seed disimpan di data/internal/secret.json.
    Margin per baris, persentase, tren, tanggal, dan jumlah transaksi praktis tidak berubah,
    tetapi harga asli tidak bisa direkonstruksi dari angka bulat.
  - tidak ada nomor WA, ID game, username, link Drive, atau catatan bebas
"""
import json, os, random, sys, warnings
import numpy as np
import pandas as pd

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
IN = os.path.join(ROOT, "data", "internal", "clean_all.csv")
SNAP = pd.Timestamp("2026-01-09")
GAMES = ["Free Fire", "Mobile Legends", "Roblox"]
GCODE = {"Free Fire": "FF", "Mobile Legends": "ML", "Roblox": "RB"}
KANAL = ["Langsung", "Mitra - dijualkan", "Mitra - dibeli mitra"]
SEGS = ["Avatar", "Fish It", "On Mic / Voice", "Lainnya", "Tidak terklasifikasi"]
SEG_MAP = {"Blox Fruit": "Lainnya", "Fisch": "Lainnya", "Grow a Garden": "Lainnya", "Lainnya": "Lainnya"}
BANDS = [0, 100_000, 150_000, 200_000, 300_000, 10**12]
BAND_NAMES = ["Murah", "Menengah bawah", "Menengah", "Menengah atas", "Premium"]
BAND_RANGES = ["< Rp100 rb", "Rp100–150 rb", "Rp150–200 rb", "Rp200–300 rb", "≥ Rp300 rb"]
warnings.simplefilter("ignore", category=DeprecationWarning)


def secret():
    p = os.path.join(ROOT, "data", "internal", "secret.json")
    sec = json.load(open(p)) if os.path.exists(p) else {}
    if "k" not in sec:
        sec["k"] = round(random.uniform(0.55, 0.8), 4)
    if "seed" not in sec:
        sec["seed"] = random.randint(1, 10**9)
    sec["catatan"] = "parameter penyamaran versi publik - JANGAN dipublikasikan"
    json.dump(sec, open(p, "w"))
    return sec


def config():
    p = os.path.join(ROOT, "config.local.json")
    return json.load(open(p, encoding="utf-8")) if os.path.exists(p) else {}


def loss_reason(row):
    t = " ".join(str(x) for x in (row.notes_raw, row.jenis_raw, row.extra_raw) if isinstance(x, str)).lower()
    t = t.replace(f"({row.pic})", "") if isinstance(row.pic, str) else t
    if "log in" in t or "login" in t:
        return "Gagal login"
    if "cust yang salah" in t:
        return "Salah kirim ke pelanggan"
    if "giveaway" in t:
        return "Giveaway"
    if "bermasalah" in t:
        return "Akun bermasalah"
    if row.status == "Tanpa status (-)":
        return "Status tidak jelas (-)"
    if t.strip() and t.strip() not in ("nan",):
        return "Catatan lain"
    return "Tanpa keterangan"


def main(mode):
    money = lambda v: None if v is None or (isinstance(v, float) and np.isnan(v)) else float(v)
    cfg = config()

    df = pd.read_csv(IN, parse_dates=["tgl_masuk", "tgl_jual"], low_memory=False)
    d = df[~df.is_empty_row].copy()
    d["seg2"] = d.segmen.map(lambda s: SEG_MAP.get(s, s) if isinstance(s, str) else None)
    # pembelian borongan Roblox: modal tidak bulat ribuan (hasil konversi kurs) dan berulang >= 3 kali
    rbm = d.loc[d.game == "Roblox", "modal_rp"]
    odd = rbm[(rbm > 0) & (rbm % 1000 != 0)].value_counts()
    d["batch"] = (d.game == "Roblox") & d.modal_rp.isin(set(odd[odd >= 3].index))
    d["band"] = pd.cut(d.jual_rp, BANDS, labels=False, right=False)
    if mode == "public":
        sec = secret()
        rng = np.random.default_rng(sec["seed"])
        f = sec["k"] * (1 + rng.uniform(-0.04, 0.04, len(d)))
        for c in ("jual_rp", "modal_rp", "profit_tercatat_rp"):
            d[c] = (d[c] * f).round()
        d["profit_rp"] = d.jual_rp - d.modal_rp

    # ---------- nama admin ----------
    w = d[d.incl_waktu].copy()
    h2 = w[(w.tgl_jual >= "2025-07-01") & (w.tgl_jual < "2026-01-01") & w.pic.notna() & (w.pic != "web")]
    order = h2.groupby("pic").jual_rp.sum().sort_values(ascending=False).index.tolist()
    order += [p for p in d.pic.dropna().unique() if p not in order and p != "web"]
    if mode == "public":
        admin_names = {p: f"Admin {chr(65 + i)}" for i, p in enumerate(order)}
    else:
        admin_names = {p: p.capitalize() for p in order}
    admins = [admin_names[p] for p in order]
    aidx = {p: i for i, p in enumerate(order)}

    def di(ts):
        return -1 if pd.isna(ts) else int(ts.strftime("%Y%m%d"))

    # ---------- transaksi bertanggal ----------
    trx = []
    for r in w.itertuples():
        trx.append([
            di(r.tgl_jual), GAMES.index(r.game), round(money(r.jual_rp)),
            round(money(r.modal_rp)) if r.modal_valid else -1,
            KANAL.index(r.kanal),
            SEGS.index(r.seg2) if r.game == "Roblox" else -1,
            aidx.get(r.pic, -1) if r.pic != "web" else -2,
            int(bool(r.tag_fs)),
            int(r.hari_terjual) if pd.notna(r.hari_terjual) and r.hari_terjual >= 0 else -1,
            int(bool(r.batch)),
            int(r.band),
        ])

    # ---------- stok (semua akun) ----------
    def stock_state(r):
        if r.incl_transaksi:
            return 0  # terjual dengan pendapatan
        if r.stok_ready:
            return 1  # Ready
        if (r.sold_tanpa_jual and r.kanal == "Langsung") or r.status == "Tanpa status (-)":
            return 2  # modal tanpa pendapatan
        if r.sold_tanpa_jual:
            return 3  # transfer ke mitra tanpa nilai
        return 4      # lain-lain (tanpa status, kosong)
    sup_ids = {s: i for i, s in enumerate(sorted(d.supplier_id.dropna().unique()))}
    stock = []
    for r in d.itertuples():
        if not isinstance(r.kode, str) and not (r.modal_rp and r.modal_rp > 0):
            continue
        stock.append([
            di(r.tgl_masuk), GAMES.index(r.game), stock_state(r),
            round(money(r.modal_rp)) if r.modal_valid else -1,
            round(money(r.jual_rp)) if (r.jual_rp or 0) > 0 else -1,
            SEGS.index(r.seg2) if r.game == "Roblox" else -1,
            int(bool(r.tag_fs)), int(bool(r.batch)), di(r.tgl_jual),
            sup_ids.get(r.supplier_id, -1),
        ])

    # ---------- kerugian ----------
    lossdf = d[((d.sold_tanpa_jual) & (d.kanal == "Langsung")) | (d.status == "Tanpa status (-)")].copy()
    lossdf["alasan"] = lossdf.apply(loss_reason, axis=1)
    loss = [dict(kode=r.kode or r.kode_raw, game=GCODE[r.game], modal=money(r.modal_rp) if r.modal_valid else 0,
                 masuk=di(r.tgl_masuk), alasan=r.alasan) for r in lossdf.sort_values("tgl_masuk").itertuples()]

    # ---------- anomali data ----------
    dq_rows = []
    for r in d[d.flag_profit_beda].itertuples():
        dq_rows.append(dict(jenis="Profit tercatat ≠ Jual − Modal", kode=r.kode, game=GCODE[r.game],
                            a=money(r.profit_tercatat_rp), b=money(r.profit_rp),
                            nilai=money(r.profit_tercatat_rp - r.profit_rp)))
    for r in d[d.flag_tgl_jual.fillna("").str.contains("sebelum")].itertuples():
        dq_rows.append(dict(jenis="Tanggal jual < tanggal masuk", kode=r.kode, game=GCODE[r.game],
                            a=di(r.tgl_masuk), b=di(r.tgl_jual), nilai=None))
    for r in d[d.incl_margin & (d.profit_rp < 0)].itertuples():
        dq_rows.append(dict(jenis="Transaksi rugi", kode=r.kode, game=GCODE[r.game],
                            a=money(r.modal_rp), b=money(r.jual_rp), nilai=money(r.profit_rp)))
    for r in d[d.incl_margin & (d.profit_rp == 0) & (d.kanal == "Langsung")].itertuples():
        dq_rows.append(dict(jenis="Jual sama dengan modal (kanal langsung)", kode=r.kode, game=GCODE[r.game],
                            a=money(r.modal_rp), b=money(r.jual_rp), nilai=0.0))

    # ---------- anomali harian ----------
    dd = w.groupby(w.tgl_jual.dt.normalize()).agg(trx=("jual_rp", "size"), rev=("jual_rp", "sum"))
    idx = pd.date_range("2025-03-01", SNAP)
    dd = dd.reindex(idx, fill_value=0)
    roll = dd.rev.rolling(28, center=True, min_periods=14).median()
    rtrx = dd.trx.rolling(28, center=True, min_periods=14).median()
    mad = (dd.rev - roll).abs().rolling(28, center=True, min_periods=14).median()
    z = (dd.rev - roll) / (1.4826 * mad)
    anomalies = []
    for day in dd.index[z.abs() > 3.5]:
        day_trx = w[w.tgl_jual == day]
        top = day_trx.sort_values("jual_rp", ascending=False).iloc[0]
        top_share = top.jual_rp / day_trx.jual_rp.sum()
        if top_share >= 0.5:
            expl = f"Didominasi 1 transaksi {BAND_NAMES[int(top.band)].lower()} ({top.kode}, {GCODE[top.game]}) = {top_share*100:.0f}% revenue hari itu"
            conf = "High"
        elif dd.trx[day] >= 2 * max(rtrx[day], 1):
            expl = f"Volume {int(dd.trx[day])} trx vs normal ±{rtrx[day]:.0f}; kemungkinan input penjualan beberapa hari dicatat di satu tanggal"
            conf = "Low"
        else:
            expl = "Kombinasi volume lebih tinggi dan beberapa transaksi bernilai besar"
            conf = "Medium"
        anomalies.append(dict(tgl=di(day), metrik="Revenue harian", expected=money(roll[day]), actual=money(dd.rev[day]),
                              dev=float(dd.rev[day] / roll[day] - 1), trx=int(dd.trx[day]), expl=expl, conf=conf))

    # ---------- statistik statis untuk narasi ----------
    S = {}
    wm = w[w.modal_valid]

    def block(mask):
        s = w[mask]
        m = s[s.modal_valid]
        return dict(trx=int(len(s)), rev=money(s.jual_rp.sum()), gp=money(m.profit_rp.sum()),
                    gpm=float(m.profit_rp.sum() / m.jual_rp.sum()) if len(m) else None,
                    aov=money(s.jual_rp.mean()) if len(s) else None,
                    med=money(s.jual_rp.median()) if len(s) else None)

    q = w.tgl_jual.dt.to_period("Q")
    ym = w.tgl_jual.dt.to_period("M")
    P = {"all": w.tgl_jual.notna(), "q3": q == pd.Period("2025Q3"), "q4": q == pd.Period("2025Q4"),
         "h1": (w.tgl_jual >= "2025-01-01") & (w.tgl_jual < "2025-07-01"),
         "h2": (w.tgl_jual >= "2025-07-01") & (w.tgl_jual < "2026-01-01"),
         "nov": ym == pd.Period("2025-11"), "dec": ym == pd.Period("2025-12"),
         "jan": ym == pd.Period("2026-01"), "y2025": w.tgl_jual.dt.year == 2025}
    for key, mask in P.items():
        S[key] = block(mask)
        for g in GAMES:
            S[key][GCODE[g]] = block(mask & (w.game == g))

    def decomp(a, b):
        out = {}
        for g in GAMES + ["ALL"]:
            sa = w[a] if g == "ALL" else w[a & (w.game == g)]
            sb = w[b] if g == "ALL" else w[b & (w.game == g)]
            t0, t1, r0, r1 = len(sa), len(sb), sa.jual_rp.sum(), sb.jual_rp.sum()
            a0, a1 = r0 / t0, r1 / t1
            out[GCODE.get(g, g)] = dict(vol=money((t1 - t0) * a0), aov=money((a1 - a0) * t1))
        return out
    S["dec_q4q3"] = decomp(P["q3"], P["q4"])
    S["dec_h2h1"] = decomp(P["h1"], P["h2"])
    S["dec_decnov"] = decomp(P["nov"], P["dec"])
    for key in ("nov", "dec"):
        s = w[P[key]]
        S[key]["aov_ex_sp"] = money(s[s.band < 4].jual_rp.mean())
        S[key]["share_premium"] = float(s[s.band >= 4].jual_rp.sum() / s.jual_rp.sum())
    S["monthly_trx"] = {str(p): int(n) for p, n in ym.value_counts().sort_index().items()}

    # kanal
    S["kanal"] = {}
    for key in ("q3", "q4"):
        s = wm[(q[wm.index] == pd.Period("2025" + key.upper()))]
        tot = w[P[key]].jual_rp.sum()
        S["kanal"][key] = {}
        for kn in KANAL:
            ss = s[s.kanal == kn]
            S["kanal"][key][kn] = dict(rev=money(w[P[key] & (w.kanal == kn)].jual_rp.sum()),
                                       share=float(w[P[key] & (w.kanal == kn)].jual_rp.sum() / tot),
                                       gpm=float(ss.profit_rp.sum() / ss.jual_rp.sum()) if len(ss) else None,
                                       trx=int((P[key] & (w.kanal == kn)).sum()))
        mit = s[s.kanal != "Langsung"]
        S["kanal"][key]["mitra_gpm"] = float(mit.profit_rp.sum() / mit.jual_rp.sum()) if len(mit) else None
        S["kanal"][key]["mitra_share"] = float(w[P[key] & (w.kanal != "Langsung")].jual_rp.sum() / tot)
    q4m = wm[q[wm.index] == pd.Period("2025Q4")]
    dg = q4m[q4m.kanal == "Langsung"].groupby("game").apply(lambda x: x.profit_rp.sum() / x.jual_rp.sum())
    mit = q4m[q4m.kanal != "Langsung"]
    S["kanal"]["gap_q4"] = money(sum(r.jual_rp * dg[r.game] - r.profit_rp for r in mit.itertuples()))
    S["kanal"]["mitra_share_q4_game"] = {GCODE[g]: float(w[P["q4"] & (w.game == g) & (w.kanal != "Langsung")].jual_rp.sum() / w[P["q4"] & (w.game == g)].jual_rp.sum()) for g in GAMES}
    ffm = w[(w.game == "Free Fire")].groupby([ym, "kanal"]).size().unstack(fill_value=0)
    S["kanal"]["ff_direct"] = {str(p): int(ffm.loc[p, "Langsung"]) for p in ffm.index if str(p) >= "2025-07"}
    S["kanal"]["ff_mitra"] = {str(p): int(ffm.loc[p].sum() - ffm.loc[p, "Langsung"]) for p in ffm.index if str(p) >= "2025-07"}
    S["kanal"]["start"] = di(w[w.kanal != "Langsung"].tgl_jual.min())

    # roblox
    rb = w[w.game == "Roblox"]
    rbq = q[rb.index]
    bt = d[d.batch]
    S["rb"] = dict(
        batch_n=int(len(bt)), batch_modal=money(bt.modal_rp.sum()),
        batch_sold=int(bt.incl_transaksi.sum()), batch_ready=int((bt.status == "Ready").sum()),
        batch_rev=money(bt[bt.incl_transaksi].jual_rp.sum()), batch_gp=money(bt[bt.incl_margin].profit_rp.sum()),
        batch_rev_q3=money(rb[(rbq == pd.Period("2025Q3")) & rb.batch].jual_rp.sum()),
        batch_rev_q4=money(rb[(rbq == pd.Period("2025Q4")) & rb.batch].jual_rp.sum()),
        ex_rev_q3=money(rb[(rbq == pd.Period("2025Q3")) & ~rb.batch].jual_rp.sum()),
        ex_rev_q4=money(rb[(rbq == pd.Period("2025Q4")) & ~rb.batch].jual_rp.sum()),
        ex_trx_q3=int(((rbq == pd.Period("2025Q3")) & ~rb.batch).sum()),
        ex_trx_q4=int(((rbq == pd.Period("2025Q4")) & ~rb.batch).sum()),
        batch_aug=int(((ym[rb.index] == pd.Period("2025-08")) & rb.batch).sum()),
        aug_trx=int((ym[rb.index] == pd.Period("2025-08")).sum()),
        batch_dts=float(rb[rb.batch].hari_terjual.median()),
    )
    seg = {}
    for sname, s in rb.groupby(rb.segmen):
        m = s[s.modal_valid]
        seg[sname] = dict(trx=int(len(s)), rev=money(s.jual_rp.sum()), aov=money(s.jual_rp.mean()),
                          gpm=float(m.profit_rp.sum() / m.jual_rp.sum()) if len(m) else None,
                          dts=float(s.hari_terjual[s.hari_terjual >= 0].median()))
    S["rb"]["seg"] = seg
    S["rb"]["fishit_dec"] = int(((ym[rb.index] == pd.Period("2025-12")) & (rb.segmen == "Fish It")).sum())

    # stok, durasi, sell-through
    v = w[w.hari_terjual.notna() & (w.hari_terjual >= 0)]
    S["dts"] = {GCODE[g]: dict(med=float(s.hari_terjual.median()), p75=float(s.hari_terjual.quantile(.75)),
                               le7=float((s.hari_terjual <= 7).mean()), n=int(len(s)))
                for g, s in v.groupby("game")}
    rd = d[d.stok_ready].copy()
    rd["age"] = (SNAP - rd.tgl_masuk).dt.days
    S["ready"] = {"n": int(len(rd)), "modal": money(rd.modal_rp.sum()), "list": money(rd.jual_rp.sum())}
    for g, s in rd.groupby("game"):
        S["ready"][GCODE[g]] = dict(n=int(len(s)), modal=money(s.modal_rp.sum()), list=money(s.jual_rp.sum()),
                                    no_date=int(s.tgl_masuk.isna().sum()), gt90=int((s.age > 90).sum()),
                                    fs=int(s.tag_fs.sum()))
    S["ready"]["rb_onmic"] = int(((rd.game == "Roblox") & (rd.segmen == "On Mic / Voice")).sum())
    S["ready"]["rb_share_n"] = float((rd.game == "Roblox").mean())
    S["ready"]["rb_share_modal"] = float(rd[rd.game == "Roblox"].modal_rp.sum() / rd.modal_rp.sum())
    S["ready"]["batch_age"] = int((SNAP - d[d.batch].tgl_masuk.median()).days)
    e = d[d.tgl_masuk.notna() & (d.kode.notna() | d.modal_valid)]
    eym = e.tgl_masuk.dt.to_period("M")
    st = e.assign(ym=eym, sold=e.status.eq("Sold")).groupby(["game", "ym"]).sold.agg(["size", "mean"])
    S["sellthrough"] = {GCODE[g]: dict(min=float(st.loc[g].loc["2025-02":"2025-11"]["mean"].min()),
                                       max=float(st.loc[g].loc["2025-02":"2025-11"]["mean"].max())) for g in GAMES}
    S["stockin"] = {GCODE[g]: {str(p): int(n) for p, n in e[e.game == g].groupby(eym[e.game == g]).size().items()} for g in GAMES}

    # ML
    ml = lambda key: S[key]["ML"]
    mlh = {}
    for key in ("h1", "h2"):
        s = wm[P[key][wm.index] & (wm.game == "Mobile Legends")]
        mlh[key] = float(s.profit_rp.sum() / s.jual_rp.sum())
    S["ml"] = dict(gpm_h1=mlh["h1"], gpm_h2=mlh["h2"], aov_h1=ml("h1")["aov"], aov_h2=ml("h2")["aov"])

    # konsentrasi
    S["conc"] = {}
    for g in GAMES + ["ALL"]:
        s = w if g == "ALL" else w[w.game == g]
        vv = s.jual_rp.sort_values(ascending=False)
        tot, n = vv.sum(), len(vv)
        S["conc"][GCODE.get(g, g)] = dict(n=int(n), top5=float(vv[:5].sum() / tot), top10=float(vv[:10].sum() / tot),
                                          top20p=float(vv[:int(np.ceil(n * .2))].sum() / tot),
                                          n80=float(((vv.cumsum() / tot < 0.8).sum() + 1) / n))
    gpg = wm.groupby("game").profit_rp.sum()
    S["conc"]["gp_share"] = {GCODE[g]: float(gpg[g] / gpg.sum()) for g in GAMES}
    rvg = w.groupby("game").jual_rp.sum()
    S["conc"]["rev_share"] = {GCODE[g]: float(rvg[g] / rvg.sum()) for g in GAMES}

    # admin (Jul-Des 2025)
    a = w[P["h2"]]
    ag = a[a.pic.notna() & (a.pic != "web")].groupby("pic").agg(trx=("jual_rp", "size"), rev=("jual_rp", "sum"))
    ag = ag.sort_values("rev", ascending=False)
    S["admin"] = dict(coverage=float(a.pic.notna().mean()), n=int(len(ag)),
                      top2_rev=float(ag.rev.iloc[:2].sum() / a.jual_rp.sum()),
                      top1_rev=float(ag.rev.iloc[0] / a.jual_rp.sum()),
                      top1=admin_names[ag.index[0]], top2=admin_names[ag.index[1]])
    a4 = w[P["q4"]]
    top2 = ag.index[:2]
    S["admin"]["top2_trx_q4"] = float(a4.pic.isin(top2).mean())

    # kebocoran
    S["loss"] = dict(n=int(len(lossdf)), modal=money(lossdf.modal_rp.sum()),
                     share_gp=float(lossdf.modal_rp.sum() / wm.profit_rp.sum()),
                     last_entry=di(lossdf.tgl_masuk.max()), first_entry=di(lossdf.tgl_masuk.min()),
                     by_reason=lossdf.groupby("alasan").size().to_dict())
    S["profit_overwrite"] = int(d.flag_profit_beda.sum())

    # rentang harga & FS
    bb = []
    for b, s in w.groupby("band"):
        m = s[s.modal_valid]
        bb.append(dict(band=int(b), trx=int(len(s)), rev=money(s.jual_rp.sum()),
                       gpm=float(m.profit_rp.sum() / m.jual_rp.sum()),
                       dts=float(s.hari_terjual[s.hari_terjual >= 0].median())))
    S["bands"] = bb
    S["fs"] = {}
    for g, s in wm.groupby("game"):
        S["fs"][GCODE[g]] = {str(bool(f)).lower(): dict(n=int(len(x)), gpm=float(x.profit_rp.sum() / x.jual_rp.sum()),
                                                        dts=float(x.hari_terjual[x.hari_terjual >= 0].median()))
                              for f, x in s.groupby("tag_fs")}

    # supplier
    sp = d[d.supplier_id.notna()]
    cnt = sp.supplier_id.value_counts()
    rep = sp.supplier_id.map(cnt) >= 2
    spm = sp[sp.incl_margin]
    repm = spm.supplier_id.map(cnt) >= 2
    S["sup"] = dict(n=int(len(cnt)), rows=int(cnt.sum()), repeat=int((cnt >= 2).sum()),
                    repeat_share=float(cnt[cnt >= 2].sum() / cnt.sum()), top10=float(cnt[:10].sum() / cnt.sum()),
                    max=int(cnt.max()), cross=int((sp.groupby("supplier_id").game.nunique() > 1).sum()),
                    gpm_rep=float(spm[repm].profit_rp.sum() / spm[repm].jual_rp.sum()),
                    gpm_one=float(spm[~repm].profit_rp.sum() / spm[~repm].jual_rp.sum()),
                    last=di(sp.tgl_masuk.max()))
    S["resale"] = dict(accounts=int(d[d.dup_game_id].groupby("game").game_id.nunique().sum()),
                       rows=int(d.dup_game_id.sum()))

    # waktu
    days = pd.date_range("2025-03-01", "2025-12-31")
    nd = pd.Series(days.dayofweek).value_counts().sort_index()
    t = w[(w.tgl_jual >= "2025-03-01") & (w.tgl_jual <= "2025-12-31")]
    S["dow"] = [dict(dow=int(i), trx_day=float((t.tgl_jual.dt.dayofweek == i).sum() / nd[i]),
                     rev_day=money(t[t.tgl_jual.dt.dayofweek == i].jual_rp.sum() / nd[i])) for i in range(7)]
    we = t.tgl_jual.dt.dayofweek >= 5
    S["weekend"] = dict(we=float(we.sum() / nd[nd.index >= 5].sum()), wd=float((~we).sum() / nd[nd.index < 5].sum()))
    wk = w.set_index("tgl_jual").resample("W-SUN").jual_rp.sum()
    wk = wk[(wk.index >= "2025-03-09") & (wk.index <= "2025-12-28")]
    S["weekly_cv"] = dict(all=float(wk.std() / wk.mean()), last13=float(wk[-13:].std() / wk[-13:].mean()))
    S["jan_pace"] = dict(jan=float(P["jan"].sum() / 9), dec=float(P["dec"].sum() / 31))
    S["h2_monthly_sd"] = dict(rev=money(w[P["h2"]].groupby(ym).jual_rp.sum().std()),
                              trx=float(w[P["h2"]].groupby(ym).size().std()))

    # rekonsiliasi & kualitas data
    S["recon"] = dict(rows=int(len(df)), nonempty=int(len(d)), sold=int((d.status == "Sold").sum()),
                      trx=int(d.incl_transaksi.sum()), dated=int(d.incl_waktu.sum()),
                      margin=int(d.incl_waktu.sum() - (d.incl_waktu & ~d.modal_valid).sum()),
                      undated_rev=money(d[d.incl_transaksi & d.tgl_jual.isna()].jual_rp.sum()),
                      sold_norev=int(d.sold_tanpa_jual.sum()), empty=int(df.is_empty_row.sum()),
                      per_game={GCODE[g]: int((df.game == g).sum()) for g in GAMES})
    flags_m = d.flag_tgl_masuk.fillna("").str.split(";").explode().value_counts().to_dict()
    flags_j = d.flag_tgl_jual.fillna("").str.split(";").explode().value_counts().to_dict()
    flags_m.pop("", None); flags_j.pop("", None)
    S["flags"] = dict(masuk=flags_m, jual=flags_j)

    payload = dict(
        mode=mode,
        company="PT XYZ" if mode == "public" else cfg.get("company_name", "Perusahaan"),
        company_short="PT XYZ" if mode == "public" else cfg.get("company_short", "Perusahaan"),
        mitra_code="" if mode == "public" else cfg.get("partner_code", ""),
        snapshot=di(SNAP), first=di(w.tgl_jual.min()), games=GAMES, gcode=[GCODE[g] for g in GAMES],
        kanal=KANAL, segs=SEGS, bands=BAND_NAMES, band_ranges=BAND_RANGES if mode == "internal" else None,
        admins=admins, trx=trx, stock=stock, loss=loss, dq=dq_rows, anomalies=anomalies, S=S,
    )
    out_dir = os.path.join(ROOT, "data", "internal" if mode == "internal" else "public")
    path = os.path.join(out_dir, f"dashboard_{mode}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"), default=float)
    print(mode, "->", path, f"{os.path.getsize(path)/1024:.0f} KB", "trx", len(trx), "stock", len(stock))
    return payload


if __name__ == "__main__":
    for m in (sys.argv[1:] or ["internal", "public"]):
        main(m)
