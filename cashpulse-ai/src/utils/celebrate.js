// Paid-invoice celebration: synthetic chime and confetti. No external assets.

let audioCtx = null;

function getAudioContext() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  return audioCtx;
}

export function playChaChing() {
  if (typeof window === "undefined" || !(window.AudioContext || window.webkitAudioContext)) {
    return;
  }

  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    const p = ctx.resume();
    if (p && typeof p.catch === "function") {
      p.catch(() => {});
    }
  }

  const now = ctx.currentTime;

  const tone = (freq, startOffset, duration) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now + startOffset);
    gain.gain.exponentialRampToValueAtTime(0.25, now + startOffset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now + startOffset);
    osc.stop(now + startOffset + duration + 0.02);
  };

  tone(587, 0, 0.18);
  tone(880, 0.16, 0.32);
}

export function fireConfetti(durationMs = 1800) {
  if (typeof document === "undefined") {
    return;
  }
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const width = window.innerWidth;
  const height = window.innerHeight;

  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
  canvas.width = width;
  canvas.height = height;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const colors = ["#ff6900", "#ffdfca", "#10b981", "#f59e0b", "#6366f1"];
  const rand = (min, max) => min + Math.random() * (max - min);

  const particles = [];
  for (let i = 0; i < 120; i++) {
    particles.push({
      x: width / 2,
      y: height * 0.35,
      vx: rand(-6, 6),
      vy: rand(-12, -4),
      size: rand(4, 9),
      color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI * 2,
      vr: rand(-0.2, 0.2),
    });
  }

  const start = performance.now();

  const frame = (time) => {
    const elapsed = time - start;
    if (elapsed > durationMs) {
      canvas.remove();
      return;
    }

    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
      p.vy += 0.35;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }

    requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);
}

export function celebratePayment() {
  try {
    playChaChing();
  } catch (err) {
    // Audio failure should not block confetti.
  }
  try {
    fireConfetti();
  } catch (err) {
    // Confetti failure should not block audio.
  }
}
