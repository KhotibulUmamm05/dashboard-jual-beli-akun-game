/* Komponen grafik SVG sederhana (tanpa library eksternal). */
const Charts = (() => {
  const NS = "http://www.w3.org/2000/svg";

  function s(tag, attrs = {}, parent) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) if (attrs[k] !== undefined && attrs[k] !== null) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function txt(parent, x, y, str, attrs = {}) {
    const t = s("text", Object.assign({ x, y }, attrs), parent);
    t.textContent = str;
    return t;
  }

  // ---------- tooltip ----------
  let tip;
  function tooltip() {
    if (!tip) {
      tip = document.createElement("div");
      tip.className = "tooltip";
      tip.setAttribute("role", "status");
      document.body.appendChild(tip);
    }
    return tip;
  }
  function showTip(ev, header, rows) {
    const t = tooltip();
    t.replaceChildren();
    if (header) {
      const h = document.createElement("div");
      h.className = "tt-h";
      h.textContent = header;
      t.appendChild(h);
    }
    rows.forEach(r => {
      const row = document.createElement("div");
      row.className = "tt-r";
      const k = document.createElement("span");
      k.className = "k";
      if (r.color) {
        const i = document.createElement("i");
        i.style.background = r.color;
        k.appendChild(i);
      }
      k.appendChild(document.createTextNode(r.label));
      const v = document.createElement("span");
      v.className = "v";
      v.textContent = r.value;
      row.append(k, v);
      t.appendChild(row);
    });
    t.style.opacity = 1;
    let x, y;
    if (ev && ev.clientX !== undefined && ev.type !== "focus") { x = ev.clientX; y = ev.clientY; }
    else if (ev && ev.target && ev.target.getBoundingClientRect) {
      const b = ev.target.getBoundingClientRect(); x = b.left + b.width / 2; y = b.top;
    } else { x = 0; y = 0; }
    const w = t.offsetWidth, h = t.offsetHeight;
    let left = x + 14, top = y - h - 10;
    if (left + w > window.innerWidth - 8) left = x - w - 14;
    if (top < 8) top = y + 16;
    t.style.left = Math.max(8, left) + "px";
    t.style.top = top + "px";
  }
  function hideTip() { if (tip) tip.style.opacity = 0; }

  // ---------- scales ----------
  function niceStep(range, n) {
    const raw = range / Math.max(1, n);
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const f = raw / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  }
  function ticks(min, max, n = 5) {
    if (min === max) { max = min + 1; }
    const st = niceStep(max - min, n);
    const lo = Math.floor(min / st) * st, hi = Math.ceil(max / st) * st;
    const out = [];
    for (let v = lo; v <= hi + st / 2; v += st) out.push(+v.toFixed(10));
    return out;
  }
  const width = el => Math.max(260, Math.floor(el.clientWidth || el.getBoundingClientRect().width || 600));
  const css = v => v; // warna dikirim sebagai var(--x)

  function leftMargin(tks, fmt) {
    const m = Math.max(...tks.map(t => String(fmt(t)).length));
    return Math.min(90, 12 + m * 6.4);
  }

  // ---------- line chart ----------
  function line(el, o) {
    el.replaceChildren();
    const W = width(el), H = o.height || 240;
    const series = o.series.filter(x => !x.hidden);
    const all = series.flatMap(x => x.values).filter(v => v !== null && v !== undefined && isFinite(v));
    let ymin = o.yMin !== undefined ? o.yMin : Math.min(0, ...all);
    let ymax = o.yMax !== undefined ? o.yMax : Math.max(...all, 0);
    if (o.yMinAuto) ymin = Math.min(...all);
    const tks = ticks(ymin, ymax, o.ticks || 4);
    ymin = Math.min(ymin, tks[0]); ymax = tks[tks.length - 1];
    const fmt = o.yFmt || (v => v);
    const m = { l: leftMargin(tks, fmt), r: o.endLabels ? 70 : 14, t: 10, b: 24 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const n = o.labels.length;
    const X = i => m.l + (n === 1 ? iw / 2 : (i * iw) / (n - 1));
    const Y = v => m.t + ih - ((v - ymin) / (ymax - ymin || 1)) * ih;
    const svg = s("svg", { width: W, height: H, role: "img", "aria-label": o.aria || "", tabindex: 0 }, el);
    if (o.band) {
      const st = n > 1 ? iw / (n - 1) : iw;
      const x0 = Math.max(m.l, X(o.band[0]) - st / 2), x1 = Math.min(m.l + iw, X(o.band[1]) + st / 2);
      s("rect", { x: x0, y: m.t, width: Math.max(2, x1 - x0), height: ih, class: "bandr" }, svg);
    }
    tks.forEach(t => {
      s("line", { x1: m.l, x2: m.l + iw, y1: Y(t), y2: Y(t), class: t === 0 ? "base" : "gridl" }, svg);
      txt(svg, m.l - 6, Y(t) + 4, fmt(t), { "text-anchor": "end" });
    });
    if (o.refLine !== undefined) {
      s("line", { x1: m.l, x2: m.l + iw, y1: Y(o.refLine.v), y2: Y(o.refLine.v), stroke: "var(--axis)", "stroke-width": 1 }, svg);
      txt(svg, m.l + iw, Y(o.refLine.v) - 4, o.refLine.label, { "text-anchor": "end" });
    }
    const every = o.xEvery || Math.ceil(n / Math.max(2, Math.floor(iw / 62)));
    o.labels.forEach((lb, i) => {
      if (i % every === 0 || i === n - 1) {
        if (i === n - 1 && i % every !== 0 && (i % every) < every * 0.6) return;
        txt(svg, X(i), H - 6, o.xFmt ? o.xFmt(lb, i) : lb, { "text-anchor": i === 0 && n > 8 ? "start" : i === n - 1 && n > 8 ? "end" : "middle" });
      }
    });
    series.forEach(sr => {
      if (o.area) {
        let d = "", open = false, first = null, last = null;
        sr.values.forEach((v, i) => {
          if (v === null || v === undefined) return;
          if (first === null) first = i;
          last = i;
          d += (open ? "L" : "M") + X(i) + "," + Y(v);
          open = true;
        });
        if (first !== null) {
          d += `L${X(last)},${Y(Math.max(ymin, 0))}L${X(first)},${Y(Math.max(ymin, 0))}Z`;
          s("path", { d, fill: sr.color, "fill-opacity": 0.1, stroke: "none" }, svg);
        }
      }
      let d = "", open = false;
      sr.values.forEach((v, i) => {
        if (v === null || v === undefined || !isFinite(v)) { open = false; return; }
        d += (open ? "L" : "M") + X(i).toFixed(1) + "," + Y(v).toFixed(1);
        open = true;
      });
      s("path", { d, fill: "none", stroke: sr.color, "stroke-width": sr.width || 2, "stroke-linejoin": "round", "stroke-linecap": "round", "stroke-dasharray": sr.dash || null, opacity: sr.opacity || null }, svg);
      if (o.dots !== false && n <= 40) {
        sr.values.forEach((v, i) => {
          if (v === null || v === undefined) return;
          if (sr.dotsAll || i === n - 1 || (o.dots === "all")) s("circle", { cx: X(i), cy: Y(v), r: 3.5, fill: sr.color, stroke: "var(--surface)", "stroke-width": 2 }, svg);
        });
      }
      if (o.endLabels) {
        let li = sr.values.length - 1;
        while (li >= 0 && (sr.values[li] === null || sr.values[li] === undefined)) li--;
        if (li >= 0) txt(svg, X(li) + 8, Y(sr.values[li]) + 4, sr.short || sr.name, { class: "lab" });
      }
    });
    (o.markers || []).forEach(mk => {
      const v = mk.v;
      const c = s("circle", { cx: X(mk.i), cy: Y(v), r: 5, fill: "var(--surface)", stroke: "var(--down)", "stroke-width": 2 }, svg);
      c.style.pointerEvents = "none";
    });
    // crosshair
    const xh = s("line", { y1: m.t, y2: m.t + ih, class: "xhair", opacity: 0 }, svg);
    const hot = series.map(sr => s("circle", { r: 4.5, fill: sr.color, stroke: "var(--surface)", "stroke-width": 2, opacity: 0 }, svg));
    const ov = s("rect", { x: m.l, y: m.t, width: iw, height: ih, fill: "transparent" }, svg);
    let cur = -1;
    const show = (i, ev) => {
      cur = i;
      xh.setAttribute("x1", X(i)); xh.setAttribute("x2", X(i)); xh.setAttribute("opacity", 1);
      series.forEach((sr, k) => {
        const v = sr.values[i];
        if (v === null || v === undefined) { hot[k].setAttribute("opacity", 0); return; }
        hot[k].setAttribute("cx", X(i)); hot[k].setAttribute("cy", Y(v)); hot[k].setAttribute("opacity", 1);
      });
      const rows = series.filter(sr => !sr.noTip).map(sr => ({ color: sr.color, label: sr.name, value: sr.values[i] === null || sr.values[i] === undefined ? "—" : (sr.fmt || o.tipFmt || fmt)(sr.values[i]) }));
      const extra = o.tipExtra ? o.tipExtra(i) : [];
      showTip(ev, o.tipHeader ? o.tipHeader(o.labels[i], i) : o.labels[i], rows.concat(extra));
    };
    ov.addEventListener("pointermove", ev => {
      const b = svg.getBoundingClientRect();
      const px = ev.clientX - b.left;
      const i = Math.max(0, Math.min(n - 1, Math.round(((px - m.l) / iw) * (n - 1))));
      show(i, ev);
    });
    ov.addEventListener("pointerleave", () => { xh.setAttribute("opacity", 0); hot.forEach(h => h.setAttribute("opacity", 0)); hideTip(); });
    svg.addEventListener("keydown", ev => {
      if (ev.key !== "ArrowRight" && ev.key !== "ArrowLeft") return;
      ev.preventDefault();
      const i = Math.max(0, Math.min(n - 1, (cur < 0 ? n - 1 : cur) + (ev.key === "ArrowRight" ? 1 : -1)));
      const b = svg.getBoundingClientRect();
      show(i, { clientX: b.left + X(i), clientY: b.top + m.t + 20 });
    });
    svg.addEventListener("blur", () => { xh.setAttribute("opacity", 0); hideTip(); });
    return svg;
  }

  // ---------- bar chart ----------
  function roundedBar(x, y, w, h, r, dir) {
    // dir: "up" (ujung data di atas), "down", "right", "left"
    r = Math.min(r, Math.abs(dir === "up" || dir === "down" ? h : w) / 2, Math.abs(dir === "up" || dir === "down" ? w : h) / 2);
    if (r <= 0.5) return `M${x},${y}h${w}v${h}h${-w}Z`;
    if (dir === "up") return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
    if (dir === "down") return `M${x},${y}V${y + h - r}Q${x},${y + h} ${x + r},${y + h}H${x + w - r}Q${x + w},${y + h} ${x + w},${y + h - r}V${y}Z`;
    if (dir === "right") return `M${x},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x}Z`;
    return `M${x + w},${y}H${x + r}Q${x},${y} ${x},${y + r}V${y + h - r}Q${x},${y + h} ${x + r},${y + h}H${x + w}Z`;
  }

  function bar(el, o) {
    el.replaceChildren();
    const W = width(el);
    const series = o.series;
    const n = o.labels.length;
    const fmt = o.yFmt || (v => v);
    const tfmt = o.tipFmt || fmt;
    if (o.horizontal) return hbar(el, o, W);
    const H = o.height || 240;
    let vals = [];
    if (o.stacked) {
      for (let i = 0; i < n; i++) {
        let pos = 0, neg = 0;
        series.forEach(sr => { const v = sr.values[i] || 0; if (v >= 0) pos += v; else neg += v; });
        vals.push(pos, neg);
      }
    } else vals = series.flatMap(sr => sr.values.map(v => v || 0));
    let ymin = Math.min(0, ...vals), ymax = Math.max(0, ...vals);
    if (o.percent) { ymin = 0; ymax = 1; }
    if (o.yMax !== undefined) ymax = o.yMax;
    const tks = ticks(ymin, ymax, o.ticks || 4);
    ymin = tks[0]; ymax = tks[tks.length - 1];
    const m = { l: leftMargin(tks, fmt), r: 10, t: o.valueLabels ? 18 : 10, b: o.rotate ? 44 : 24 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const Y = v => m.t + ih - ((v - ymin) / (ymax - ymin || 1)) * ih;
    const svg = s("svg", { width: W, height: H, role: "img", "aria-label": o.aria || "" }, el);
    const bw = iw / n;
    if (o.band) s("rect", { x: m.l + o.band[0] * bw, y: m.t, width: (o.band[1] - o.band[0] + 1) * bw, height: ih, class: "bandr" }, svg);
    tks.forEach(t => {
      s("line", { x1: m.l, x2: m.l + iw, y1: Y(t), y2: Y(t), class: t === 0 ? "base" : "gridl" }, svg);
      txt(svg, m.l - 6, Y(t) + 4, fmt(t), { "text-anchor": "end" });
    });
    const every = o.xEvery || Math.ceil(n / Math.max(2, Math.floor(iw / 54)));
    const groups = o.stacked ? 1 : series.length;
    const slot = bw * 0.78;
    const thick = Math.min(o.barMax || 24, (slot - (groups - 1) * 2) / groups);
    const gw = thick * groups + (groups - 1) * 2;
    for (let i = 0; i < n; i++) {
      const cx = m.l + bw * i + bw / 2;
      if (i % every === 0) {
        const lb = o.xFmt ? o.xFmt(o.labels[i], i) : o.labels[i];
        if (o.rotate) txt(svg, cx, H - m.b + 12, lb, { "text-anchor": "end", transform: `rotate(-35 ${cx} ${H - m.b + 12})` });
        else txt(svg, cx, H - 6, lb, { "text-anchor": "middle" });
      }
      const outside = o.dimOutside && o.band && (i < o.band[0] || i > o.band[1]);
      const tipRows = () => {
        const rows = series.map(sr => ({ color: sr.color, label: sr.name, value: sr.values[i] === null || sr.values[i] === undefined ? "—" : tfmt(sr.values[i], i, sr) }));
        if (o.stacked && series.length > 1 && !o.percent && o.showTotal !== false) rows.push({ label: "Total", value: tfmt(series.reduce((a, sr) => a + (sr.values[i] || 0), 0), i) });
        return rows.concat(o.tipExtra ? o.tipExtra(i) : []);
      };
      if (o.stacked) {
        let pos = 0, neg = 0;
        const segs = series.map((sr, k) => ({ sr, k, v: sr.values[i] || 0 })).filter(x => x.v !== 0);
        const topPos = segs.filter(x => x.v > 0).slice(-1)[0];
        const botNeg = segs.filter(x => x.v < 0).slice(-1)[0];
        segs.forEach(sg => {
          const v = sg.v;
          let a, b;
          if (v >= 0) { a = pos; b = pos + v; pos = b; } else { a = neg; b = neg + v; neg = b; }
          const isEnd = sg === topPos || sg === botNeg;
          let top = Math.min(Y(a), Y(b)), h = Math.abs(Y(a) - Y(b));
          if (!isEnd) { if (v >= 0) { top += 2; h -= 2; } else { h -= 2; } }
          h = Math.max(0.5, h);
          s("path", { d: roundedBar(cx - thick / 2, top, thick, h, isEnd ? 4 : 0, v >= 0 ? "up" : "down"), fill: sg.sr.color, class: "mark" + (outside ? " dim" : "") }, svg);
        });
        const hit = s("rect", { x: m.l + bw * i, y: m.t, width: bw, height: ih, fill: "transparent", tabindex: 0 }, svg);
        hit.style.cursor = "default";
        hit.addEventListener("pointermove", ev => showTip(ev, o.tipHeader ? o.tipHeader(o.labels[i], i) : o.labels[i], tipRows()));
        hit.addEventListener("focus", ev => showTip(ev, o.tipHeader ? o.tipHeader(o.labels[i], i) : o.labels[i], tipRows()));
        hit.addEventListener("pointerleave", hideTip);
        hit.addEventListener("blur", hideTip);
        if (o.valueLabels && pos > 0 && (o.valueLabels === "all" || (Array.isArray(o.valueLabels) && o.valueLabels.includes(i)))) txt(svg, cx, Y(pos) - 5, (o.labelFmt || fmt)(pos), { "text-anchor": "middle", class: "lab" });
      } else {
        series.forEach((sr, k) => {
          const v = sr.values[i];
          if (v === null || v === undefined) return;
          const x = cx - gw / 2 + k * (thick + 2);
          const y0 = Y(0), y1 = Y(v);
          const p = s("path", { d: roundedBar(x, Math.min(y0, y1), thick, Math.max(0.5, Math.abs(y1 - y0)), 4, v >= 0 ? "up" : "down"), fill: sr.color, class: "mark" + (outside ? " dim" : "") }, svg);
          const hdr = o.tipHeader ? o.tipHeader(o.labels[i], i) : o.labels[i];
          const hit = s("rect", { x: x - 3, y: m.t, width: thick + 6, height: ih, fill: "transparent", tabindex: 0 }, svg);
          const sh = ev => { p.classList.add("hot"); showTip(ev, hdr, series.length > 1 ? tipRows() : [{ color: sr.color, label: sr.name, value: tfmt(v, i, sr) }].concat(o.tipExtra ? o.tipExtra(i) : [])); };
          const hd = () => { p.classList.remove("hot"); hideTip(); };
          hit.addEventListener("pointermove", sh); hit.addEventListener("focus", sh);
          hit.addEventListener("pointerleave", hd); hit.addEventListener("blur", hd);
          if (o.valueLabels && (o.valueLabels === "all" || (Array.isArray(o.valueLabels) && o.valueLabels.includes(i)))) txt(svg, x + thick / 2, v >= 0 ? y1 - 5 : y1 + 13, (o.labelFmt || fmt)(v), { "text-anchor": "middle", class: "lab" });
        });
      }
    }
    return svg;
  }

  function hbar(el, o, W) {
    const series = o.series;
    const n = o.labels.length;
    const fmt = o.yFmt || (v => v);
    const tfmt = o.tipFmt || fmt;
    const rowH = o.rowH || 30;
    const H = n * rowH + 26;
    const lw = Math.min(o.labelWidth || 150, W * 0.38);
    let vals = o.stacked ? o.labels.map((_, i) => series.reduce((a, sr) => a + (sr.values[i] || 0), 0)) : series.flatMap(sr => sr.values.map(v => v || 0));
    let xmin = Math.min(0, ...vals), xmax = Math.max(0, ...vals);
    if (o.percent) { xmin = 0; xmax = 1; }
    if (o.xMax !== undefined) xmax = o.xMax;
    const tks = ticks(xmin, xmax, Math.max(2, Math.floor((W - lw) / 90)));
    xmin = tks[0]; xmax = tks[tks.length - 1];
    const m = { l: lw, r: o.valueLabels === false ? 12 : 62, t: 4, b: 22 };
    const iw = W - m.l - m.r;
    const X = v => m.l + ((v - xmin) / (xmax - xmin || 1)) * iw;
    const svg = s("svg", { width: W, height: H, role: "img", "aria-label": o.aria || "" }, el);
    tks.forEach(t => {
      s("line", { x1: X(t), x2: X(t), y1: m.t, y2: H - m.b, class: t === 0 ? "base" : "gridl" }, svg);
      txt(svg, X(t), H - 6, fmt(t), { "text-anchor": "middle" });
    });
    const groups = o.stacked ? 1 : series.length;
    const thick = Math.min(o.barMax || 18, (rowH * 0.7 - (groups - 1) * 2) / groups);
    o.labels.forEach((lb, i) => {
      const cy = m.t + i * rowH + rowH / 2;
      txt(svg, m.l - 8, cy + 4, lb, { "text-anchor": "end", class: o.boldRows && o.boldRows.includes(i) ? "lab-strong" : "lab" });
      const tipRows = () => series.map(sr => ({ color: sr.color, label: sr.name, value: tfmt(sr.values[i] || 0, i, sr) })).concat(o.tipExtra ? o.tipExtra(i) : []);
      if (o.stacked) {
        let acc = 0;
        const segs = series.map(sr => ({ sr, v: sr.values[i] || 0 })).filter(x => x.v > 0);
        segs.forEach((sg, k) => {
          const x0 = X(acc), x1 = X(acc + sg.v);
          acc += sg.v;
          const last = k === segs.length - 1;
          s("path", { d: roundedBar(x0 + (k ? 1 : 0), cy - thick / 2, Math.max(0.5, x1 - x0 - (k ? 1 : 0) - (last ? 0 : 1)), thick, last ? 4 : 0, "right"), fill: sg.sr.color, class: "mark" }, svg);
        });
        if (o.valueLabels !== false) txt(svg, X(acc) + 6, cy + 4, (o.labelFmt || fmt)(acc, i), { class: "lab" });
      } else {
        series.forEach((sr, k) => {
          const v = sr.values[i] || 0;
          const y = cy - (groups * thick + (groups - 1) * 2) / 2 + k * (thick + 2);
          const x0 = X(0), x1 = X(v);
          s("path", { d: roundedBar(Math.min(x0, x1), y, Math.max(0.5, Math.abs(x1 - x0)), thick, 4, v >= 0 ? "right" : "left"), fill: (o.colorFn ? o.colorFn(i, v) : sr.color), class: "mark" }, svg);
          if (o.valueLabels !== false) txt(svg, v >= 0 ? x1 + 6 : x1 - 6, y + thick / 2 + 4, (o.labelFmt || fmt)(v, i), { class: "lab", "text-anchor": v >= 0 ? "start" : "end" });
        });
      }
      const hit = s("rect", { x: 0, y: cy - rowH / 2, width: W, height: rowH, fill: "transparent", tabindex: 0 }, svg);
      const sh = ev => showTip(ev, lb, tipRows());
      hit.addEventListener("pointermove", sh); hit.addEventListener("focus", sh);
      hit.addEventListener("pointerleave", hideTip); hit.addEventListener("blur", hideTip);
    });
    return svg;
  }

  // ---------- scatter / bubble ----------
  function scatter(el, o) {
    el.replaceChildren();
    const W = width(el), H = o.height || 300;
    const pts = o.points;
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
    let xmin = Math.min(...xs, o.xRef ?? Infinity), xmax = Math.max(...xs, o.xRef ?? -Infinity);
    let ymin = Math.min(...ys, o.yRef ?? Infinity), ymax = Math.max(...ys, o.yRef ?? -Infinity);
    const px = (xmax - xmin) * 0.12 || 0.1, py = (ymax - ymin) * 0.15 || 0.1;
    const xt = ticks(xmin - px, xmax + px, 5), yt = ticks(ymin - py, ymax + py, 4);
    xmin = xt[0]; xmax = xt[xt.length - 1]; ymin = yt[0]; ymax = yt[yt.length - 1];
    const m = { l: leftMargin(yt, o.yFmt) + 14, r: 16, t: 12, b: 40 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const X = v => m.l + ((v - xmin) / (xmax - xmin)) * iw;
    const Y = v => m.t + ih - ((v - ymin) / (ymax - ymin)) * ih;
    const svg = s("svg", { width: W, height: H, role: "img", "aria-label": o.aria || "" }, el);
    yt.forEach(t => { s("line", { x1: m.l, x2: m.l + iw, y1: Y(t), y2: Y(t), class: "gridl" }, svg); txt(svg, m.l - 6, Y(t) + 4, o.yFmt(t), { "text-anchor": "end" }); });
    xt.forEach(t => { s("line", { x1: X(t), x2: X(t), y1: m.t, y2: m.t + ih, class: "gridl" }, svg); txt(svg, X(t), m.t + ih + 15, o.xFmt(t), { "text-anchor": "middle" }); });
    if (o.xRef !== undefined) s("line", { x1: X(o.xRef), x2: X(o.xRef), y1: m.t, y2: m.t + ih, class: "base" }, svg);
    if (o.yRef !== undefined) s("line", { x1: m.l, x2: m.l + iw, y1: Y(o.yRef), y2: Y(o.yRef), class: "base" }, svg);
    if (o.quad) {
      txt(svg, m.l + 6, m.t + 14, o.quad[0], { class: "lab" });
      txt(svg, m.l + iw - 6, m.t + 14, o.quad[1], { class: "lab", "text-anchor": "end" });
      txt(svg, m.l + 6, m.t + ih - 8, o.quad[2], { class: "lab" });
      txt(svg, m.l + iw - 6, m.t + ih - 8, o.quad[3], { class: "lab", "text-anchor": "end" });
    }
    txt(svg, m.l + iw / 2, H - 4, o.xLabel || "", { "text-anchor": "middle", class: "lab" });
    txt(svg, 12, m.t + ih / 2, o.yLabel || "", { "text-anchor": "middle", class: "lab", transform: `rotate(-90 12 ${m.t + ih / 2})` });
    const rmax = Math.max(...pts.map(p => p.size || 1));
    pts.slice().sort((a, b) => (b.size || 1) - (a.size || 1)).forEach(p => {
      const r = o.bubble ? 6 + 18 * Math.sqrt((p.size || 1) / rmax) : 6;
      const c = s("circle", { cx: X(p.x), cy: Y(p.y), r, fill: p.color, "fill-opacity": p.faint ? 0.55 : 0.85, stroke: "var(--surface)", "stroke-width": 2, class: "mark" }, svg);
      txt(svg, X(p.x) + r + 4, Y(p.y) + 4, p.label, { class: p.faint ? "lab" : "lab-strong" });
      const hit = s("circle", { cx: X(p.x), cy: Y(p.y), r: Math.max(r + 4, 12), fill: "transparent", tabindex: 0 }, svg);
      const sh = ev => { c.classList.add("hot"); showTip(ev, p.label, p.tip || []); };
      const hd = () => { c.classList.remove("hot"); hideTip(); };
      hit.addEventListener("pointermove", sh); hit.addEventListener("focus", sh);
      hit.addEventListener("pointerleave", hd); hit.addEventListener("blur", hd);
    });
    return svg;
  }

  // ---------- sparkline ----------
  function spark(values, color, w = 140, h = 30, hiFrom) {
    const svg = s("svg", { width: w, height: h, class: "spark", "aria-hidden": "true" });
    const v = values.map(x => (x === null || x === undefined ? null : x));
    const nums = v.filter(x => x !== null);
    if (nums.length < 2) return svg;
    const mn = Math.min(...nums), mx = Math.max(...nums);
    const X = i => 2 + (i * (w - 6)) / (v.length - 1);
    const Y = x => h - 3 - ((x - mn) / (mx - mn || 1)) * (h - 6);
    let d = "", d2 = "";
    v.forEach((x, i) => {
      if (x === null) return;
      if (hiFrom !== undefined && i >= hiFrom) d2 += (d2 ? "L" : "M") + X(i) + "," + Y(x);
      if (hiFrom === undefined || i <= hiFrom) d += (d ? "L" : "M") + X(i) + "," + Y(x);
    });
    s("path", { d, fill: "none", stroke: hiFrom !== undefined ? "var(--axis)" : color, "stroke-width": 1.5, "stroke-linejoin": "round" }, svg);
    if (d2) s("path", { d: d2, fill: "none", stroke: color, "stroke-width": 2, "stroke-linejoin": "round" }, svg);
    const li = v.length - 1;
    if (v[li] !== null) s("circle", { cx: X(li), cy: Y(v[li]), r: 2.5, fill: color }, svg);
    return svg;
  }

  function legend(items, kind = "sw") {
    const d = document.createElement("div");
    d.className = "legend";
    items.forEach(it => {
      const sp = document.createElement("span");
      const sw = document.createElement("i");
      sw.className = it.kind || kind;
      sw.style.background = it.color;
      sp.append(sw, document.createTextNode(it.name));
      d.appendChild(sp);
    });
    return d;
  }

  return { line, bar, scatter, spark, legend, showTip, hideTip, ticks };
})();
