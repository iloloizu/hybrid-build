/* ---------- figure engine: original stick-figure illustrations ---------- */
export const LEN = { torso: 50, head: 13, th: 42, sh: 40, ua: 30, fa: 28, foot: 13 };
export const rad = d => d * Math.PI / 180;
export const dirC = deg => [Math.sin(rad(deg)), -Math.cos(rad(deg))]; // compass: 0 up, 90 right, 180 down
export const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k];
export function ik(A, C, l1, l2, s) {
  let dx = C[0] - A[0], dy = C[1] - A[1];
  let d = Math.hypot(dx, dy);
  const dd = Math.min(Math.max(d, Math.abs(l1 - l2) + 0.01), l1 + l2 - 0.01);
  const phi = Math.atan2(dy, dx);
  const a = Math.acos((l1 * l1 + dd * dd - l2 * l2) / (2 * l1 * dd));
  const ang = phi + s * a;
  const J = [A[0] + l1 * Math.cos(ang), A[1] + l1 * Math.sin(ang)];
  const ex = C[0] - J[0], ey = C[1] - J[1], el = Math.hypot(ex, ey) || 1;
  return [J, [J[0] + ex / el * l2, J[1] + ey / el * l2]];
}
export const SIDE = { hip: [92, 104], t: 0, an: [93, 186], an2: [89, 186], ha: [96, 112], ha2: [92, 112], kb: -1, kb2: -1, eb: 1, eb2: 1, ft: 90, ft2: 90 };
export const FRONT = { hip: [100, 104], haL: [80, 112], haR: [120, 112], anL: [90, 186], anR: [110, 186], ebL: 1, ebR: -1, kbL: 1, kbR: -1 };
export function solve(p0) {
  const J = {};
  if (p0.v === "front") {
    const p = Object.assign({}, FRONT, p0);
    J.hip = p.hip; J.neck = add(p.hip, [0, -50]); J.head = add(J.neck, [0, -13]);
    J.shL = add(J.neck, [-16, 4]); J.shR = add(J.neck, [16, 4]);
    J.hipL = add(p.hip, [-9, 0]); J.hipR = add(p.hip, [9, 0]);
    [["L"], ["R"]].forEach(([s]) => {
      if (p["el" + s]) { J["el" + s] = p["el" + s]; J["ha" + s] = p["ha" + s]; }
      else { const r = ik(J["sh" + s], p["ha" + s], LEN.ua, LEN.fa, p["eb" + s]); J["el" + s] = r[0]; J["ha" + s] = r[1]; }
      if (p["kn" + s]) { J["kn" + s] = p["kn" + s]; J["an" + s] = p["an" + s]; }
      else { const r = ik(J["hip" + s], p["an" + s], LEN.th, LEN.sh, p["kb" + s]); J["kn" + s] = r[0]; J["an" + s] = r[1]; }
      J["to" + s] = add(J["an" + s], [s === "L" ? -6 : 6, 1]);
    });
    return J;
  }
  const p = Object.assign({}, SIDE, p0);
  J.hip = p.hip; J.neck = add(p.hip, dirC(p.t), LEN.torso); J.head = add(J.neck, dirC(p.t + (p.ht || 0)), LEN.head);
  J.mid = add(p.hip, dirC(p.t), LEN.torso * 0.5);
  ["", "2"].forEach(s => {
    if (p["el" + s]) { J["el" + s] = p["el" + s]; J["ha" + s] = p["ha" + s]; }
    else { const r = ik(J.neck, p["ha" + s], LEN.ua, LEN.fa, p["eb" + s]); J["el" + s] = r[0]; J["ha" + s] = r[1]; }
    if (p["kn" + s]) { J["kn" + s] = p["kn" + s]; J["an" + s] = p["an" + s]; }
    else { const r = ik(J.hip, p["an" + s], LEN.th, LEN.sh, p["kb" + s]); J["kn" + s] = r[0]; J["an" + s] = r[1]; }
    J["to" + s] = add(J["an" + s], dirC(p["ft" + s]), LEN.foot);
  });
  return J;
}
export function lerpJ(A, B, k) { const o = {}; for (const n in A) o[n] = B[n] ? [A[n][0] + (B[n][0] - A[n][0]) * k, A[n][1] + (B[n][1] - A[n][1]) * k] : A[n]; return o; }

export const C = { body: "#6c6f78", far: "#3b3d43", hl: "#ff4b2b", hlFar: "#9a3a24", prop: "#8b877e", propFill: "#1e1e21", ground: "#29292c", cable: "#c8f031" };
C.prop = "#9a968c"; C.propFill = "#1b1b1e";
export const ln = (a, b, col, w, extra = "") => `<line x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="${col}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`;
export function drawProps(props, J, layer) {
  let s = "";
  (props || []).forEach(pr => {
    const dyn = !!pr.at;
    if ((layer === "back") === dyn) return;
    const P = pr.at ? add(J[pr.at] || [0, 0], pr.off || [0, 0]) : null;
    switch (pr.k) {
      case "rect": s += `<rect x="${pr.x}" y="${pr.y}" width="${pr.w}" height="${pr.h}" rx="${pr.r || 2}" fill="${C.propFill}" stroke="${C.prop}" stroke-width="1.5"/>`; break;
      case "poly": s += `<polygon points="${pr.pts.map(q => q.join(",")).join(" ")}" fill="${C.propFill}" stroke="${C.prop}" stroke-width="1.5"/>`; break;
      case "line": s += ln(pr.a, pr.b, C.prop, pr.w || 4); break;
      case "post": s += `<rect x="${pr.x - 4}" y="${pr.y1}" width="8" height="${pr.y2 - pr.y1}" fill="${C.propFill}" stroke="${C.prop}" stroke-width="1.5"/>`; break;
      case "cable": s += ln(pr.from, J[pr.to], C.cable, 1.6) + `<circle cx="${pr.from[0]}" cy="${pr.from[1]}" r="3.5" fill="${C.prop}"/>`; break;
      case "plate": s += `<circle cx="${P[0].toFixed(1)}" cy="${P[1].toFixed(1)}" r="${pr.r || 12}" fill="${C.propFill}" stroke="${C.prop}" stroke-width="3"/><circle cx="${P[0].toFixed(1)}" cy="${P[1].toFixed(1)}" r="2" fill="${C.prop}"/>`; break;
      case "db": s += `<rect x="${(P[0] - 8).toFixed(1)}" y="${(P[1] - 3).toFixed(1)}" width="16" height="6" rx="2" fill="${C.prop}"/><rect x="${(P[0] - 9).toFixed(1)}" y="${(P[1] - 6).toFixed(1)}" width="5" height="12" rx="1.5" fill="${C.prop}"/><rect x="${(P[0] + 4).toFixed(1)}" y="${(P[1] - 6).toFixed(1)}" width="5" height="12" rx="1.5" fill="${C.prop}"/>`; break;
      case "bar": s += ln(J[pr.at], J[pr.to], C.prop, 3.5); break;
      case "grip": s += `<circle cx="${P[0].toFixed(1)}" cy="${P[1].toFixed(1)}" r="4" fill="${C.prop}"/>`; break;
    }
  });
  return s;
}
/* ---------- figure engine v2: articulated muscle mannequin ---------- */
export function seg(a, b, w1, w2, col) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  const p = (q, w, s) => `${(q[0] + nx * w / 2 * s).toFixed(1)},${(q[1] + ny * w / 2 * s).toFixed(1)}`;
  return `<path d="M${p(a, w1, 1)} L${p(b, w2, 1)} L${p(b, w2, -1)} L${p(a, w1, -1)} Z" fill="${col}"/><circle cx="${a[0].toFixed(1)}" cy="${a[1].toFixed(1)}" r="${w1 / 2}" fill="${col}"/><circle cx="${b[0].toFixed(1)}" cy="${b[1].toFixed(1)}" r="${w2 / 2}" fill="${col}"/>`;
}
export const NEARP = { base: "#3b3e47", musc: "#6a6e7a", line: "#121316", sec: "#9c5140", hot0: "#cf3a1f", hot1: "#ff6a3c" };
export const FARP = { base: "#212329", musc: "#33363e", line: "#0c0d0f", sec: "#5a322a", hot0: "#7d2616", hot1: "#96301c" };
export function mixHex(a, b, k) { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, "0")).join(""); }
export function smoothPath(pts) {
  const n = pts.length, f = v => v.toFixed(1); let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
  }
  return d + "Z";
}
// prof rows: [t along a→b, half-width on the front side, half-width on the back side]; fs picks which side is "front"
export function shapeD(a, b, prof, fs) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, fx = -uy * fs, fy = ux * fs;
  const at = (t, o) => [a[0] + dx * t + fx * o, a[1] + dy * t + fy * o];
  const p0 = prof[0], p1 = prof[prof.length - 1];
  const c0 = (p0[1] + p0[2]) * 0.38 / L, c1 = (p1[1] + p1[2]) * 0.38 / L;
  const pts = prof.map(p => at(p[0], p[1]));
  pts.push(at(p1[0] + c1, (p1[1] - p1[2]) / 2));
  for (let i = prof.length - 1; i >= 0; i--) pts.push(at(prof[i][0], -prof[i][2]));
  pts.push(at(p0[0] - c0, (p0[1] - p0[2]) / 2));
  return smoothPath(pts);
}
export const MUSCLE_KEYS = [
  [/upper chest|chest/i, ["chest"]], [/front delt|side delt/i, ["delt"]], [/rear delt/i, ["reardelt"]], [/lower traps/i, ["traps"]],
  [/triceps/i, ["triceps"]], [/biceps|brachialis/i, ["biceps"]], [/forearm|brachioradialis/i, ["forearm"]], [/lats/i, ["lats"]], [/upper back/i, ["traps", "upperback"]],
  [/^back$|spine|spinal|erector/i, ["lowerback"]], [/abs/i, ["abs"]], [/hip flexor/i, ["hipflex"]], [/quads|knees|adductor/i, ["quads"]], [/glute/i, ["glutes"]],
  [/hamstring/i, ["hams"]], [/calves|soleus|achilles/i, ["calves"]], [/tibialis|shins/i, ["tib"]]
];
export function muscleKeys(list) { const pri = new Set(), sec = new Set(); list.forEach((m, i) => MUSCLE_KEYS.forEach(([re, ks]) => { if (re.test(m)) ks.forEach(k => (i === 0 ? pri : sec).add(k)); })); pri.forEach(k => sec.delete(k)); return [pri, sec]; }

export function figInner(J, ex, opts = {}) {
  const [pri, sec] = ex._mk || (ex._mk = muscleKeys(ex.muscles || []));
  const k = opts.k == null ? 1 : opts.k;
  const only = (ex.hl || []).some(h => /R$/.test(h)) && !(ex.hl || []).some(h => /L$/.test(h)) ? "R" : null;
  const col = (P, keys, side) => {
    if (side && only && side !== only) return P.musc;
    const ks = [].concat(keys);
    if (ks.some(x => pri.has(x))) return mixHex(P.hot0, P.hot1, k);
    if (ks.some(x => sec.has(x))) return P.sec;
    return P.musc;
  };
  const base = (P, a, b, prof, fs) => `<path d="${shapeD(a, b, prof, fs)}" fill="${P.base}" stroke="${P.line}" stroke-width="1.1"/>`;
  const mus = (c, a, b, prof, fs) => `<path d="${shapeD(a, b, prof, fs)}" fill="${c}"/>`;
  const dot = (p, r, c) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${r}" fill="${c}"/>`;
  let s = `<ellipse cx="${J.hip[0].toFixed(1)}" cy="189.5" rx="36" ry="3.6" fill="#18191d"/>` + ln([0, 188.5], [200, 188.5], "#26272c", 1.5);
  s += drawProps(ex.props, J, "back");
  const N = NEARP, F = FARP;
  if (ex.v === "front") {
    const leg = S => { const h = J["hip" + S], kn = J["kn" + S], an = J["an" + S], to = J["to" + S];
      return base(N, an, to, [[-0.2, 3, 3], [1, 2.8, 2.8]], 1)
        + base(N, kn, an, [[0, 5.5, 5.5], [0.3, 6, 6], [1, 3, 3]], 1) + mus(col(N, ["calves", "tib"]), kn, an, [[0.08, 4.2, 4.2], [0.32, 4.7, 4.7], [0.75, 2.3, 2.3]], 1)
        + base(N, h, kn, [[0, 8.5, 8.5], [0.35, 9, 9], [1, 5.6, 5.6]], 1) + mus(col(N, "quads"), h, kn, [[0.14, 6.4, 6.4], [0.42, 7.1, 7.1], [0.9, 4.1, 4.1]], 1) + dot(kn, 3.4, N.base); };
    const arm = S => { const sh = J["sh" + S], el = J["el" + S], ha = J["ha" + S];
      return base(N, sh, el, [[0, 5.8, 5.8], [0.4, 6.2, 6.2], [1, 4.3, 4.3]], 1) + mus(col(N, "biceps", S), sh, el, [[0.28, 3.9, 3.9], [0.55, 4.5, 4.5], [0.88, 3, 3]], 1)
        + base(N, el, ha, [[0, 4.6, 4.6], [0.3, 5, 5], [1, 2.8, 2.8]], 1) + mus(col(N, "forearm", S), el, ha, [[0.08, 3.5, 3.5], [0.35, 3.8, 3.8], [0.78, 2.1, 2.1]], 1)
        + dot(el, 3, N.base) + dot(ha, 3.6, N.musc)
        + mus(col(N, ["delt", "reardelt"], S), sh, el, [[-0.2, 6.3, 6.3], [0.05, 7.5, 7.5], [0.32, 4.9, 4.9]], 1); };
    const n = J.neck, h = J.hip, P = (o, dx, dy) => [o[0] + dx, o[1] + dy];
    s += leg("L") + leg("R");
    const L = [P(n, -5, -3), P(n, -20, 1), P(n, -17.5, 16), P(h, -11.5, -18), P(h, -12.5, -2), P(h, -10, 6), P(h, 0, 8)];
    const R = [P(h, 10, 6), P(h, 12.5, -2), P(h, 11.5, -18), P(n, 17.5, 16), P(n, 20, 1), P(n, 5, -3)];
    s += `<path d="${smoothPath(L.concat(R))}" fill="${N.base}" stroke="${N.line}" stroke-width="1.1"/>`;
    [-1, 1].forEach(m => {
      s += `<path d="${smoothPath([P(n, 4 * m, -4), P(n, 15 * m, 0.5), P(n, 6 * m, 3.5)])}" fill="${col(N, ["traps", "upperback"])}"/>`;
      s += `<path d="${smoothPath([P(n, 15.5 * m, 13), P(n, 16.5 * m, 21), P(h, 10.5 * m, -20), P(n, 10.5 * m, 23)])}" fill="${col(N, "lats")}"/>`;
      s += `<ellipse cx="${(n[0] + 7.6 * m).toFixed(1)}" cy="${(n[1] + 12.5).toFixed(1)}" rx="7" ry="6" fill="${col(N, "chest")}"/>`;
      for (let r = 0; r < 3; r++) s += `<rect x="${(n[0] + (m < 0 ? -6.3 : 0.7)).toFixed(1)}" y="${(n[1] + 21.5 + r * 7.2).toFixed(1)}" width="5.6" height="6" rx="2" fill="${col(N, "abs")}"/>`;
    });
    s += base(N, n, J.head, [[0, 4.3, 4.3], [0.7, 4, 4]], 1) + `<ellipse cx="${J.head[0].toFixed(1)}" cy="${J.head[1].toFixed(1)}" rx="8" ry="9.4" fill="${N.musc}" stroke="${N.line}" stroke-width="1.1"/>`;
    s += arm("L") + arm("R");
  } else {
    const leg = (P, h, kn, an, to) =>
      base(P, an, to, [[-0.3, 2.8, 3.4], [0.4, 2.8, 3.4], [1, 1.6, 2.8]], -1)
      + base(P, kn, an, [[0, 5.6, 5.8], [0.3, 5.2, 6.6], [1, 2.9, 3.1]], -1)
      + mus(col(P, "calves"), kn, an, [[0.06, 5, -0.7], [0.3, 5.8, -0.7], [0.72, 2.5, -0.4]], 1)
      + mus(col(P, "tib"), kn, an, [[0.1, 4.2, -0.8], [0.4, 4.2, -0.8], [0.85, 2.2, -0.6]], -1)
      + base(P, h, kn, [[0, 9, 9], [0.35, 9.5, 9], [1, 5.8, 5.6]], -1)
      + mus(col(P, "hipflex"), h, kn, [[-0.04, 7.6, -2.5], [0.08, 8.2, -2.5]], -1)
      + mus(col(P, "quads"), h, kn, [[0.2, 8, -1], [0.45, 8.3, -1], [0.9, 4.7, -1]], -1)
      + mus(col(P, "hams"), h, kn, [[0.14, 7.6, -1], [0.45, 7.8, -1], [0.88, 4.5, -1]], 1)
      + dot(kn, 3.2, P.base);
    const arm = (P, sh, el, ha, cap) =>
      base(P, sh, el, [[0, 6, 6], [0.4, 6.3, 6.3], [1, 4.4, 4.4]], -1)
      + mus(col(P, "biceps"), sh, el, [[0.3, 5.3, -0.7], [0.56, 5.6, -0.7], [0.88, 3.7, -0.7]], -1)
      + mus(col(P, "triceps"), sh, el, [[0.24, 5.3, -0.7], [0.5, 5.8, -0.7], [0.88, 3.7, -0.7]], 1)
      + base(P, el, ha, [[0, 4.6, 4.6], [0.3, 5, 4.8], [1, 2.8, 2.8]], -1)
      + mus(col(P, "forearm"), el, ha, [[0.08, 3.8, 3.6], [0.35, 4, 3.8], [0.78, 2.2, 2]], -1)
      + dot(el, 2.8, P.base) + dot(ha, 3.6, P.musc)
      + (cap ? mus(col(P, "delt"), sh, el, [[-0.18, 6.6, 0.4], [0.04, 7.6, 0.4], [0.34, 4.8, -0.6]], -1) + mus(col(P, "reardelt"), sh, el, [[-0.18, 6.6, 0.4], [0.04, 7.6, 0.4], [0.34, 4.8, -0.6]], 1) : "");
    const h = J.hip, n = J.neck;
    const tx = n[0] - h[0], ty = n[1] - h[1], tl = Math.hypot(tx, ty) || 1, ux = tx / tl, uy = ty / tl, fx = -uy, fy = ux; // torso front
    s += leg(F, h, J.kn2, J.an2, J.to2) + arm(F, n, J.el2, J.ha2, false);
    s += base(N, h, n, [[0, 9.5, 10], [0.3, 9.5, 9], [0.6, 11, 10], [0.85, 12, 11], [1, 8.5, 9]], 1);
    s += mus(col(N, "abs"), h, n, [[0.08, 8.2, -0.6], [0.3, 8.2, -0.6], [0.52, 9.2, -0.6]], 1)
      + mus(col(N, "chest"), h, n, [[0.62, 9.8, -0.6], [0.76, 10.8, -0.6], [0.9, 9.6, -1.5]], 1)
      + mus(col(N, "lowerback"), h, n, [[0.06, 8.6, -0.6], [0.3, 7.8, -0.6]], -1)
      + mus(col(N, "lats"), h, n, [[0.4, 7.8, -0.6], [0.6, 8.8, -0.6], [0.8, 9.6, -0.6]], -1)
      + mus(col(N, ["traps", "upperback"]), h, n, [[0.87, 9.6, -3], [1.0, 7.5, -2]], -1);
    const hd = J.head, hx = hd[0] - n[0], hy = hd[1] - n[1], hl = Math.hypot(hx, hy) || 1, vx = hx / hl, vy = hy / hl, gx = -vy, gy = vx;
    s += base(N, n, hd, [[0, 4.4, 4.6], [0.7, 4, 4.2]], 1);
    s += `<circle cx="${(hd[0] + gx * 3 - vx * 4).toFixed(1)}" cy="${(hd[1] + gy * 3 - vy * 4).toFixed(1)}" r="5.4" fill="${N.musc}"/>` + `<circle cx="${hd[0].toFixed(1)}" cy="${hd[1].toFixed(1)}" r="8.6" fill="${N.musc}"/>`;
    s += leg(N, h, J.kn, J.an, J.to);
    s += dot([h[0] - fx * 3.5 - ux * 1, h[1] - fy * 3.5 - uy * 1], 8, col(N, "glutes"));
    s += arm(N, n, J.el, J.ha, true);
  }
  return s + drawProps(ex.props, J, "front");
}
export const svgWrap = (inner, label) => `<svg viewBox="0 0 200 200" role="img" aria-label="${label}"><rect width="200" height="200" fill="#0b0b0d"/>${inner}</svg>`;
export function figure(J, ex, opts = {}) { return svgWrap(figInner(J, ex, opts), ex.name + (opts.label ? ", " + opts.label : "")); }

/* rigid tween: interpolate targets, re-solve joints so limbs keep their length */
export function tweenJ(ex, k) {
  const c = ex._tw || (ex._tw = (() => { const D = ex.v === "front" ? FRONT : SIDE; const PA = Object.assign({ v: ex.v }, D, ex.A), PB = Object.assign({ v: ex.v }, D, ex.B); return { PA, PB, JA: solve(Object.assign({ v: ex.v }, ex.A)), JB: solve(Object.assign({ v: ex.v }, ex.B)) }; })());
  const { PA, PB, JA, JB } = c, lp = (a, b) => a + (b - a) * k, lv = (a, b) => [lp(a[0], b[0]), lp(a[1], b[1])], dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const limb = (root, rA, rB, mid, end) => { // root now; names of mid/end joints
    const l1 = lp(dist(rA, JA[mid]), dist(rB, JB[mid])), l2 = lp(dist(JA[mid], JA[end]), dist(JB[mid], JB[end]));
    const tm = lv(JA[mid], JB[mid]), te = lv(JA[end], JB[end]);
    const s1 = ik(root, te, l1, l2, 1), s2 = ik(root, te, l1, l2, -1);
    return dist(s1[0], tm) <= dist(s2[0], tm) ? s1 : s2;
  };
  const J = {};
  if (ex.v === "front") {
    J.hip = lv(PA.hip, PB.hip); J.neck = add(J.hip, [0, -50]); J.head = add(J.neck, [0, -13]);
    ["L", "R"].forEach(S => { const m = S === "L" ? -1 : 1;
      J["sh" + S] = add(J.neck, [16 * m, 4]); J["hip" + S] = add(J.hip, [9 * m, 0]);
      const a = limb(J["sh" + S], JA["sh" + S], JB["sh" + S], "el" + S, "ha" + S); J["el" + S] = a[0]; J["ha" + S] = a[1];
      const l = limb(J["hip" + S], JA["hip" + S], JB["hip" + S], "kn" + S, "an" + S); J["kn" + S] = l[0]; J["an" + S] = l[1];
      J["to" + S] = add(J["an" + S], [6 * m, 1]); });
    return J;
  }
  const t = lp(PA.t, PB.t), ht = lp(PA.ht || 0, PB.ht || 0);
  J.hip = lv(PA.hip, PB.hip); J.neck = add(J.hip, dirC(t), LEN.torso); J.mid = add(J.hip, dirC(t), LEN.torso * 0.5); J.head = add(J.neck, dirC(t + ht), LEN.head);
  ["", "2"].forEach(S => {
    const a = limb(J.neck, JA.neck, JB.neck, "el" + S, "ha" + S); J["el" + S] = a[0]; J["ha" + S] = a[1];
    const l = limb(J.hip, JA.hip, JB.hip, "kn" + S, "an" + S); J["kn" + S] = l[0]; J["an" + S] = l[1];
    J["to" + S] = add(J["an" + S], dirC(lp(PA["ft" + S], PB["ft" + S])), LEN.foot);
  });
  return J;
}
export const NF = 24;
export function clipSVG(ex) { let g = ""; for (let i = 0; i < NF; i++) { const k = i / (NF - 1); g += `<g class="fr" style="display:${i ? "none" : "inline"}">${figInner(tweenJ(ex, k), ex, { k })}</g>`; } return svgWrap(g, ex.name + " animation"); }

/* ---------- muscle map (front + back) ---------- */
export function bodyMap(list) {
  const [pri, sec] = muscleKeys(list);
  const c = k => pri.has(k) ? C.hl : sec.has(k) ? C.hlFar : "#3a3b40";
  const sil = "#25262a";
  const body = cx => {
    const m = x => cx + (x - 55);
    return `<circle cx="${m(55)}" cy="18" r="10" fill="${sil}"/>` + seg([m(55), 26], [m(55), 34], 8, 8, sil)
      + `<polygon points="${m(35)},34 ${m(75)},34 ${m(70)},96 ${m(40)},96" fill="${sil}" stroke="${sil}" stroke-width="6" stroke-linejoin="round"/>`
      + `<polygon points="${m(39)},94 ${m(71)},94 ${m(70)},112 ${m(40)},112" fill="${sil}" stroke="${sil}" stroke-width="4" stroke-linejoin="round"/>`
      + seg([m(32), 38], [m(27), 72], 11, 9, sil) + seg([m(27), 72], [m(23), 104], 9, 6, sil)
      + seg([m(78), 38], [m(83), 72], 11, 9, sil) + seg([m(83), 72], [m(87), 104], 9, 6, sil)
      + seg([m(46), 108], [m(45), 150], 16, 11, sil) + seg([m(45), 150], [m(45), 188], 11, 7, sil)
      + seg([m(64), 108], [m(65), 150], 16, 11, sil) + seg([m(65), 150], [m(65), 188], 11, 7, sil);
  };
  const E = (x, y, rx, ry, k, rot = 0) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${x} ${y})" fill="${c(k)}"/>`;
  const front = body(55)
    + E(33, 41, 7, 7, "delt") + E(77, 41, 7, 7, "delt")
    + E(47, 50, 9, 7, "chest") + E(63, 50, 9, 7, "chest")
    + E(29, 56, 4, 10, "biceps", 8) + E(81, 56, 4, 10, "biceps", -8)
    + E(25, 87, 3.5, 11, "forearm", 7) + E(85, 87, 3.5, 11, "forearm", -7)
    + `<rect x="49" y="62" width="12" height="31" rx="4" fill="${c("abs")}"/>` + E(43, 79, 3.5, 9, "abs") + E(67, 79, 3.5, 9, "abs")
    + E(48, 112, 5, 6, "hipflex") + E(62, 112, 5, 6, "hipflex")
    + E(45, 131, 7, 17, "quads") + E(65, 131, 7, 17, "quads")
    + E(43, 168, 3, 12, "tib") + E(67, 168, 3, 12, "tib");
  const bx = 110;
  const back = body(55 + bx)
    + `<polygon points="${165},28 ${179},38 ${165},60 ${151},38" fill="${c("traps")}"/>`
    + E(143, 41, 7, 7, "reardelt") + E(187, 41, 7, 7, "reardelt")
    + E(165, 56, 9, 6, "upperback")
    + `<polygon points="153,50 147,80 161,92 158,62" fill="${c("lats")}"/><polygon points="177,50 183,80 169,92 172,62" fill="${c("lats")}"/>`
    + E(139, 57, 4.5, 10, "triceps", 8) + E(191, 57, 4.5, 10, "triceps", -8)
    + `<rect x="160" y="80" width="10" height="16" rx="3" fill="${c("lowerback")}"/>`
    + E(157, 104, 9, 9, "glutes") + E(173, 104, 9, 9, "glutes")
    + E(156, 133, 7, 17, "hams") + E(174, 133, 7, 17, "hams")
    + E(155, 166, 5, 11, "calves") + E(175, 166, 5, 11, "calves");
  return `<svg viewBox="0 0 220 196" role="img" aria-label="Muscles worked: ${list.join(", ")}">${front}${back}<text x="55" y="195" text-anchor="middle" fill="#6e6a62" font-size="8" font-family="Manrope, sans-serif" letter-spacing="1">FRONT</text><text x="165" y="195" text-anchor="middle" fill="#6e6a62" font-size="8" font-family="Manrope, sans-serif" letter-spacing="1">BACK</text></svg>`;
}
