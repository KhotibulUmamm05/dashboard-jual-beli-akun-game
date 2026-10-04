"""
Tahap 1 - Parse & Clean data jual beli akun (Free Fire, Mobile Legends, Roblox).

Input : data/raw/*.xlsx (tidak di-commit)
Output: data/internal/clean_all.csv (satu baris = satu baris sumber Excel, tidak ada baris yang
        dihapus; baris yang dikecualikan ditandai lewat kolom flag / incl_*).

Aturan utama (lihat juga halaman Metodologi di dashboard):
  R1  Tanggal bertipe datetime di Excel = string D/M yang salah dibaca sebagai M/D
      -> hari & bulan ditukar (true_month = dt.day, true_day = dt.month).
  R2  Tanggal string dibaca sebagai D/M[/Y]. Tahun 2 digit -> 20YY.
  R3  Tahun hilang / tidak valid (<2024 atau >2026) -> ditentukan dari konteks.
  R4  Tanggal > snapshot (tanggal data terakhir) mustahil -> tahun dikurangi 1.
  R5  Tanggal masuk yang menyimpang > 60 hari dari median tetangga (urutan baris)
      dan kembali wajar bila tahun digeser +-1 -> tahun dikoreksi (flag).
  R6  Tanggal jual < tanggal masuk dan wajar bila tahun +1 -> dikoreksi (flag).
  R7  Nominal < 1.000 dianggap satuan ribu (x1.000); >= 1.000 dianggap rupiah penuh.
      Aturan ini cocok dengan kolom Profit pada 1.879 dari 1.891 baris yang dapat diuji (99,4%).
  R8  Profit dihitung ulang = Jual - Modal; Profit tercatat yang berbeda diberi flag.
"""
import openpyxl, datetime as dt, re, hashlib, statistics, os, json
import pandas as pd

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SRC = os.path.join(ROOT, "data", "raw") + os.sep
OUT = os.path.join(ROOT, "data", "internal")
os.makedirs(OUT, exist_ok=True)

FILES = {
    "Mobile Legends": "Data Jual Beli Akun Mobile Legends.xlsx",
    "Roblox": "Data Jual Beli Akun Roblox.xlsx",
    "Free Fire": "Data Jual Beli Akun Free Fire.xlsx",
}
# indeks kolom (0-based) per file
COLS = {
    "Mobile Legends": dict(tgl=0, wa=1, link=2, game=3, tipe=4, kode=5, gid=6, modal=7, jual=8,
                           profit=9, sold=10, status=11, notes=13, mitra=14, extra=[29]),
    "Roblox": dict(tgl=0, wa=1, link=2, game=3, tipe=4, kode=5, gid=6, modal=7, jual=8, profit=9,
                   sold=10, status=11, jenis=12, ket=13, mitra=14, notes=16, extra=[15]),
    "Free Fire": dict(tgl=0, link=1, wa=2, game=3, kode=4, gid=5, modal=6, jual=7, profit=8,
                      sold=9, status=10, notes=11, lvl=14, takeby=15, mitra=16, extra=[12, 13, 17]),
}
SNAPSHOT_MAX = dt.date(2026, 1, 31)  # batas atas sementara; snapshot final dihitung dari data


def num(v):
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return float(v)
    s = str(v).strip()
    if re.fullmatch(r"\d{1,3}(\.\d{3})+", s):
        return float(s.replace(".", ""))
    if re.fullmatch(r"\d+,\d+", s):
        return float(s.replace(",", "."))
    try:
        return float(s)
    except ValueError:
        return None


def to_rp(v):
    """R7: < 1.000 -> satuan ribu; >= 1.000 -> rupiah penuh."""
    if v is None:
        return None
    return v if abs(v) >= 1000 else v * 1000


def parse_date(v):
    """Kembalikan (day, month, year|None, sumber) atau None."""
    if v is None:
        return None
    if isinstance(v, dt.datetime):
        # R1: swap
        return (v.month, v.day, v.year, "dt_swapped")
    s = str(v).strip().rstrip(".").replace("//", "/")
    m = re.fullmatch(r"(\d{1,2})/(\d{1,2})(?:/(\d{2,5}))?", s)
    if not m:
        return None
    d, mo = int(m.group(1)), int(m.group(2))
    y = m.group(3)
    if y is not None:
        y = int(y)
        if y < 100:
            y += 2000
        if y == 20225:  # typo yang ditemukan di data
            y = 2025
    if not (1 <= mo <= 12 and 1 <= d <= 31):
        return None
    return (d, mo, y, "str")


def mk(d, mo, y):
    try:
        return dt.date(y, mo, d)
    except ValueError:
        return None


def norm_wa(v):
    if v is None:
        return None
    s = re.sub(r"\D", "", str(v))
    if len(s) < 8:
        return None
    if s.startswith("0"):
        s = "62" + s[1:]
    elif s.startswith("8"):
        s = "62" + s
    elif s.startswith("63"):  # salah ketik kode negara 63 -> 62 ditemukan di data
        s = "62" + s[2:]
    return s


# Nama admin & ejaan alternatifnya disimpan di config.local.json (tidak di-commit).
# Tanpa file itu, admin dideteksi otomatis: token "(nama)" yang muncul >= 5 kali di kolom catatan.
_cfg_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "config.local.json")
CFG = json.load(open(_cfg_path, encoding="utf-8")) if os.path.exists(_cfg_path) else {}
ALIASES = CFG.get("admin_aliases", {})
ADMINS = set(CFG.get("admins", []))
PIC_RE = re.compile(r"\(?\s*([a-z]+)\s*\)")


def detect_admins(texts, min_count=5):
    cnt = {}
    for t in texts:
        m = PIC_RE.search(str(t).lower())
        if m:
            n = ALIASES.get(m.group(1), m.group(1))
            cnt[n] = cnt.get(n, 0) + 1
    return {n for n, c in cnt.items() if c >= min_count}


def norm_pic(*vals):
    for v in vals:
        if v is None:
            continue
        s = str(v).lower()
        if s.strip() == "web":
            return "web"
        m = PIC_RE.search(s)
        if m:
            n = ALIASES.get(m.group(1), m.group(1))
            if n in ADMINS:
                return n
        if s.strip() in ADMINS:
            return s.strip()
    return None


def roblox_segment(*texts):
    t = " ".join(str(x).lower() for x in texts if x)
    if not t.strip():
        return None
    if re.search(r"fish ?it|fih it|element|elemen|secret|secr|rood|ghostf|frostborn|bamboo|el maj", t):
        return "Fish It"
    if re.search(r"on ?mic|onmic|open voice", t):
        return "On Mic / Voice"
    if re.search(r"gag|grow a garden", t):
        return "Grow a Garden"
    if re.search(r"blox ?fruit|\bbf\b|kitsune", t):
        return "Blox Fruit"
    if re.search(r"\bava\b|avatar|\bava ", t) or t.startswith("ava"):
        return "Avatar"
    if re.search(r"fisch", t):
        return "Fisch"
    if re.search(r"cdid|deadrails|dedrel|brainrot|forge|general|banyak|bocil", t):
        return "Lainnya"
    return None


rows = []
for game, fname in FILES.items():
    c = COLS[game]
    ws = openpyxl.load_workbook(SRC + fname).active
    for ridx, r in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
        g = lambda k: r[c[k]] if k in c and c[k] < len(r) else None
        kode = g("kode")
        modal_raw, jual_raw, profit_raw = g("modal"), g("jual"), g("profit")
        status_raw = g("status")
        empty = (kode is None and modal_raw is None and (jual_raw in (None, 0))
                 and g("tgl") is None and g("sold") is None)
        if isinstance(kode, str) and kode.strip().lower() in {"kode akun"}:
            empty = True
        m_, j_, p_ = num(modal_raw), num(jual_raw), num(profit_raw)
        rec = dict(
            game=game, src_file=fname, src_row=ridx,
            kode_raw=None if kode is None else str(kode).strip(),
            tgl_masuk_raw=None if g("tgl") is None else (g("tgl").strftime("DT:%Y-%m-%d") if isinstance(g("tgl"), dt.datetime) else str(g("tgl"))),
            tgl_jual_raw=None if g("sold") is None else (g("sold").strftime("DT:%Y-%m-%d") if isinstance(g("sold"), dt.datetime) else str(g("sold"))),
            _tgl=parse_date(g("tgl")), _sold=parse_date(g("sold")),
            modal_raw=modal_raw, jual_raw=jual_raw, profit_raw=profit_raw,
            modal_rp=to_rp(m_), jual_rp=to_rp(j_), profit_tercatat_rp=to_rp(p_),
            status_raw=status_raw,
            tipe_raw=g("tipe"),
            jenis_raw=g("jenis"), ket_raw=g("ket"),
            notes_raw=g("notes"),
            extra_raw=" | ".join(str(r[i]) for i in c.get("extra", []) if i < len(r) and r[i] is not None) or None,
            takeby_raw=g("takeby"),
            lvl=g("lvl"),
            wa=norm_wa(g("wa")),
            game_id=None if g("gid") is None else str(g("gid")).strip(),
            harga_mitra_rp=to_rp(num(g("mitra"))),
            has_link=g("link") is not None,
            is_empty_row=empty,
        )
        rows.append(rec)

df = pd.DataFrame(rows)

# ---------- status ----------
def norm_status(s):
    if s is None:
        return "Kosong"
    s = str(s).strip().lower()
    return {"sold": "Sold", "ready": "Ready", "-": "Tanpa status (-)"}.get(s, "Lainnya")

df["status"] = df["status_raw"].map(norm_status)

# ---------- kode akun ----------
def norm_kode(game, k):
    if not k:
        return None
    pre = {"Free Fire": "FF", "Mobile Legends": "ML", "Roblox": "RBL"}[game]
    m = re.match(r"\s*(?:ff|ml|rbl)\s*-?\s*(\d+)", k, re.I)
    return f"{pre}-{int(m.group(1)):04d}" if m else None

df["kode"] = [norm_kode(g, k) for g, k in zip(df.game, df.kode_raw)]
low = df.kode_raw.fillna("").str.lower()
df["tag_fs"] = low.str.contains(r"\(fs\b|\bfs\)", regex=True)
df["tag_bermasalah"] = low.str.contains("bermasalah|hubungi|ga bisa|gabisa")
df["tag_keep"] = low.str.contains("keep")

# kanal penjualan lewat mitra re-seller. Kode mitra disimpan di config.local.json ("partner_code").
#   "Dibeli <kode>" -> akun dibeli oleh mitra
#   "(nnn <kode>)"  -> akun dijualkan lewat mitra
PC = CFG.get("partner_code", "").lower()
if PC:
    pc = re.escape(PC)
    notes = (df.notes_raw.fillna("").astype(str) + " " + df.extra_raw.fillna("").astype(str)).str.lower()
    df["tag_mitra"] = low.str.contains(rf"\d{{3}}\s*{pc}|\({pc}\)|cust {pc}", regex=True) | notes.str.contains(rf"\b{pc}\b", regex=True)
    df["tag_dibeli_mitra"] = low.str.contains(f"dibeli {PC}", regex=False)
else:
    print("peringatan: partner_code tidak ada di config.local.json, semua transaksi dianggap kanal langsung")
    df["tag_mitra"] = False
    df["tag_dibeli_mitra"] = False
df["kanal"] = "Langsung"
df.loc[df.tag_mitra, "kanal"] = "Mitra - dijualkan"
df.loc[df.tag_dibeli_mitra, "kanal"] = "Mitra - dibeli mitra"

# ---------- PIC / channel ----------
if not ADMINS:
    ADMINS.update(detect_admins(list(df.notes_raw.dropna()) + list(df.jenis_raw.dropna()) + list(df.extra_raw.dropna())))
df["pic"] = [norm_pic(n, j if g == "Roblox" else None, e if g == "Roblox" else None)
             for n, j, e, g in zip(df.notes_raw, df.jenis_raw, df.extra_raw, df.game)]
txt_all = (df.notes_raw.fillna("").astype(str) + " " + df.jenis_raw.fillna("").astype(str) + " " +
           df.extra_raw.fillna("").astype(str) + " " + df.takeby_raw.fillna("").astype(str)).str.lower()
df["note_giveaway"] = txt_all.str.contains("giveaway")
df["note_gabisa_login"] = txt_all.str.contains("gabisa login|ga bisa login")
df["note_penalty"] = txt_all.str.contains("penalty")
df["note_req_akun"] = txt_all.str.contains("req akun")
df["note_diskon"] = txt_all.str.contains(r"dis \d+k|diskon")

# ---------- segmen Roblox ----------
df["segmen"] = None
rb = df.game == "Roblox"
df.loc[rb, "segmen"] = [roblox_segment(t, j, k) for t, j, k in zip(df.loc[rb, "tipe_raw"], df.loc[rb, "jenis_raw"], df.loc[rb, "ket_raw"])]
df.loc[rb & df.segmen.isna(), "segmen"] = "Tidak terklasifikasi"

# ---------- tanggal ----------
def first_pass(p):
    if p is None:
        return None, "missing"
    d, mo, y, src = p
    if y is None or y < 2024 or y > 2026:
        return None, "need_year"
    return mk(d, mo, y), src

df["_tgl1"], df["_tgl1_src"] = zip(*df["_tgl"].map(first_pass))
df["_sold1"], df["_sold1_src"] = zip(*df["_sold"].map(first_pass))

# snapshot = tanggal maksimum yang 'masuk akal': ambil maksimum tanggal string ber-tahun eksplisit
# dan tanggal datetime ber-tahun, lalu buang yang > SNAPSHOT_MAX (dt bertahun 2026 hasil parsing tanpa tahun)
cands = [d for d in list(df._tgl1) + list(df._sold1) if d is not None and d <= SNAPSHOT_MAX]
SNAPSHOT = max(cands)

flags_tgl, flags_sold = [], []
tgl_final, sold_final = [None] * len(df), [None] * len(df)

for game in FILES:
    idx = df.index[df.game == game].tolist()
    # pass A: R3/R4 untuk tanggal masuk
    tmp = {}
    for i in idx:
        p = df.at[i, "_tgl"]
        d1 = df.at[i, "_tgl1"]
        fl = []
        if p is None:
            tmp[i] = (None, ["tgl_masuk_kosong"])
            continue
        d, mo, y, src = p
        if d1 is None:  # tahun hilang/invalid -> tahun terbaru yang <= snapshot
            for yy in (2026, 2025, 2024):
                cand = mk(d, mo, yy)
                if cand and cand <= SNAPSHOT:
                    d1 = cand
                    break
            fl.append("tahun_diinfer" if y is None else "tahun_invalid_dikoreksi")
        elif d1 > SNAPSHOT:
            d1 = mk(d, mo, d1.year - 1)
            fl.append("tahun_lewat_snapshot_dikoreksi")
        tmp[i] = (d1, fl)
    # pass B: R5 konsistensi urutan (median tetangga, window +-7 baris bertanggal)
    dated = [i for i in idx if tmp[i][0] is not None]
    for pos, i in enumerate(dated):
        neigh = [tmp[j][0] for j in dated[max(0, pos - 7):pos] + dated[pos + 1:pos + 8]]
        if len(neigh) < 3:
            continue
        med = sorted(neigh)[len(neigh) // 2]
        d1, fl = tmp[i]
        if abs((d1 - med).days) > 60:
            best = None
            for shift in (-1, 1):
                cand = mk(d1.day, d1.month, d1.year + shift)
                if cand and abs((cand - med).days) <= 60 and cand <= SNAPSHOT:
                    best = cand
            raw = df.at[i, "_tgl"]
            unswap = mk(raw[1], raw[0], d1.year) if raw[3] == "dt_swapped" else None
            if best:
                tmp[i] = (best, fl + ["tahun_typo_dikoreksi_konteks"])
            elif unswap and abs((unswap - med).days) <= 60:
                # R5b: datetime yang ternyata sudah benar (tidak perlu ditukar)
                tmp[i] = (unswap, fl + ["dt_tidak_ditukar_konteks"])
            else:
                tmp[i] = (d1, fl + ["tgl_masuk_di_luar_urutan"])
    for i in idx:
        tgl_final[i] = tmp[i][0]
        flags_tgl.append((i, tmp[i][1]))

    # tanggal jual
    for i in idx:
        p = df.at[i, "_sold"]
        s1 = df.at[i, "_sold1"]
        fl = []
        e = tgl_final[i]
        if p is None:
            if df.at[i, "tgl_jual_raw"] not in (None, ""):
                fl.append("tgl_jual_tidak_terbaca")
            sold_final[i] = None
            flags_sold.append((i, fl))
            continue
        d, mo, y, src = p
        if s1 is None:
            base_years = [e.year, e.year + 1] if e else [2026, 2025, 2024]
            choice = None
            for yy in sorted(set(base_years), reverse=not e):
                cand = mk(d, mo, yy)
                if cand and cand <= SNAPSHOT and (e is None or cand >= e):
                    choice = cand
                    break
            if choice is None:
                for yy in (2026, 2025, 2024):
                    cand = mk(d, mo, yy)
                    if cand and cand <= SNAPSHOT:
                        choice = cand
                        break
            s1 = choice
            fl.append("tahun_jual_diinfer" if y is None else "tahun_jual_invalid_dikoreksi")
        if s1 and s1 > SNAPSHOT:
            cand = mk(s1.day, s1.month, s1.year - 1)
            s1 = cand
            fl.append("tahun_jual_lewat_snapshot_dikoreksi")
        if s1 and e and s1 < e:
            cand = mk(s1.day, s1.month, s1.year + 1)
            if cand and cand <= SNAPSHOT and (cand - e).days <= 365:
                s1 = cand
                fl.append("tahun_jual_typo_dikoreksi")
            else:
                fl.append("tgl_jual_sebelum_tgl_masuk")
        sold_final[i] = s1
        flags_sold.append((i, fl))

df["tgl_masuk"] = pd.to_datetime(pd.Series(tgl_final, index=df.index))
df["tgl_jual"] = pd.to_datetime(pd.Series(sold_final, index=df.index))
ft = dict(flags_tgl)
fs = dict(flags_sold)
df["flag_tgl_masuk"] = [";".join(ft.get(i, [])) for i in df.index]
df["flag_tgl_jual"] = [";".join(fs.get(i, [])) for i in df.index]
df["hari_terjual"] = (df.tgl_jual - df.tgl_masuk).dt.days

# ---------- nominal ----------
df["profit_rp"] = df.jual_rp - df.modal_rp
df["flag_profit_beda"] = (df.profit_tercatat_rp.notna() & df.profit_rp.notna() &
                          ((df.profit_rp - df.profit_tercatat_rp).abs() > 1))
df["selisih_profit_rp"] = (df.profit_tercatat_rp - df.profit_rp).where(df.flag_profit_beda)
df["unit_ribu_modal"] = df.modal_raw.map(lambda v: num(v) is not None and abs(num(v)) < 1000)
df["unit_rupiah_jual"] = df.jual_raw.map(lambda v: num(v) is not None and abs(num(v)) >= 1000)
df["mitra_ratio"] = df.harga_mitra_rp / df.modal_rp

# ---------- duplikasi ----------
# supplier (nomor WA = penjual akun ke perusahaan) -> ID pseudonim, urut kemunculan pertama
order = df[df.wa.notna()].sort_values(["tgl_masuk", "game", "src_row"]).wa.drop_duplicates().tolist()
sup_map = {w: f"S-{i + 1:04d}" for i, w in enumerate(order)}
df["supplier_id"] = df.wa.map(sup_map)

df["dup_kode"] = df.kode.notna() & df.duplicated(["game", "kode"], keep=False)
gid = df.game_id.fillna("").str.lower().str.replace(r"\s", "", regex=True)
df["dup_game_id"] = (gid != "") & (gid != "-") & df.assign(_g=gid).duplicated(["game", "_g"], keep=False)

# ---------- klasifikasi inklusi ----------
sold = df.status == "Sold"
df["jual_valid"] = df.jual_rp.fillna(0) > 0
df["modal_valid"] = df.modal_rp.fillna(0) > 0
df["incl_transaksi"] = (~df.is_empty_row) & sold & df.jual_valid
df["incl_margin"] = df.incl_transaksi & df.modal_valid
df["incl_waktu"] = df.incl_transaksi & df.tgl_jual.notna()
df["sold_tanpa_jual"] = (~df.is_empty_row) & sold & ~df.jual_valid
df["stok_ready"] = (~df.is_empty_row) & (df.status == "Ready") & (df.kode.notna() | df.modal_valid)

keep = [c for c in df.columns if not c.startswith("_")]
df[keep].to_csv(os.path.join(OUT, "clean_all.csv"), index=False, encoding="utf-8-sig")
json.dump({"snapshot": str(SNAPSHOT)}, open(os.path.join(OUT, "meta.json"), "w"))
print("SNAPSHOT", SNAPSHOT, "rows", len(df))
