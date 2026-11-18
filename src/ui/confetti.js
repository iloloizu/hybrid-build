/* ---------- confetti: a short burst, skipped with reduced motion ---------- */
export function confetti() {
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = document.createElement("canvas"), dpr = Math.min(2, window.devicePixelRatio || 1);
  c.className = "confetti"; c.width = innerWidth * dpr; c.height = innerHeight * dpr; document.body.appendChild(c);
  const x = c.getContext("2d"); x.scale(dpr, dpr);
  const cols = ["#ff5b1f", "#c8f031", "#4cc9f0", "#f3efe6"];
  const P = Array.from({ length: 140 }, () => ({ x: innerWidth / 2 + (Math.random() - .5) * 80, y: innerHeight * .62, vx: (Math.random() - .5) * 13, vy: -9 - Math.random() * 10, r: Math.random() * 6.28, vr: (Math.random() - .5) * .4, w: 6 + Math.random() * 6, h: 3 + Math.random() * 4, c: cols[Math.floor(Math.random() * 4)] }));
  const t0 = performance.now();
  const step = now => {
    const t = now - t0; x.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of P) { p.vy += .38; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.globalAlpha = Math.max(0, 1 - t / 1800); x.fillStyle = p.c; x.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); x.restore(); }
    if (t < 1800) requestAnimationFrame(step); else c.remove();
  };
  requestAnimationFrame(step);
}
