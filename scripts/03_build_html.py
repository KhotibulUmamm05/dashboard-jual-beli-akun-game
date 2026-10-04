"""
Tahap 3 - Rakit dashboard menjadi satu file HTML mandiri (tanpa dependensi eksternal).

internal -> output/internal/dashboard_internal.html (tidak di-commit)
public   -> docs/index.html (untuk GitHub Pages)
"""
import json, os, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SRC = os.path.join(ROOT, "dashboard")
read = lambda p: open(os.path.join(SRC, p), encoding="utf-8").read()

TARGETS = {
    "internal": ("data/internal/dashboard_internal.json", "output/internal/dashboard_internal.html",
                 None),
    "public": ("data/public/dashboard_public.json", "docs/index.html",
               "Dashboard Analitik Jual Beli Akun Game · PT XYZ"),
}


def build(mode):
    data_path, out_path, title = TARGETS[mode]
    if title is None:
        title = "Dashboard Analitik Jual Beli Akun · " + json.load(open(os.path.join(ROOT, data_path), encoding="utf-8"))["company_short"]
    data = open(os.path.join(ROOT, data_path), encoding="utf-8").read().replace("</", "<\\/")
    js = "\n".join(read(f) for f in ("charts.js", "app.js", "pages1.js", "pages2.js"))
    html = (read("template.html")
            .replace("__TITLE__", title)
            .replace("__DESC__", "Analisis penjualan akun Free Fire, Mobile Legends, dan Roblox: revenue, margin, stok, risiko, dan opsi keputusan.")
            .replace("__CSS__", read("style.css"))
            .replace("__DATA__", data)
            .replace("__JS__", js))
    out = os.path.join(ROOT, out_path)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, "w", encoding="utf-8").write(html)
    print(mode, "->", out_path, f"{os.path.getsize(out) / 1024:.0f} KB")


if __name__ == "__main__":
    for m in (sys.argv[1:] or ["internal", "public"]):
        build(m)
