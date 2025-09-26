"use client";
import { useEffect, useRef } from "react";

export default function SubtleWaterGrid() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    // -------- SETTINGS --------
    const cellSize = 50; // each box size
    const baseAlpha = 0.04; // baseline opacity
    const maxBoost = 0.4; // wave boost cap
    const strokeColor: [number, number, number] = [255, 255, 255]; // border color
    const damping = 0.92; // wave damping
    const c2 = 0.1; // wave speed
    const brushRadius = 28;
    const brushStrength = 0.25;
    const boostCurveK = 1.5;

    // ---- RADIAL FLASH (centered) ----
    const flashPeriod = 3000;      // ms between flashes
    const flashDuration = 1200;    // ms a flash lasts
    const flashAlphaMax = 0.45;    // extra alpha at peak
    const idleResumeMs = 1800;     // resume flashing after no movement

    // NEW: radius controls
    const FLASH_RADIUS_PX = 240;   // smaller circle core size (tweak me)
    const FLASH_SOFTNESS  = 0.65;  // 0.4 = sharper edge, 1.0 = softer

    // Flash state
    let flashStart = 0;
    let flashTimer: number | null = null;
    let idleTimer: number | null = null;

    function startFlashTimer() {
      if (flashTimer) return;
      flashTimer = window.setInterval(() => {
        flashStart = performance.now();
      }, flashPeriod);
    }
    function stopFlashTimer() {
      if (flashTimer) {
        window.clearInterval(flashTimer);
        flashTimer = null;
      }
    }
    function scheduleResumeFlashes() {
      if (idleTimer) window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        startFlashTimer();
        flashStart = performance.now(); // trigger immediately after idle
      }, idleResumeMs);
    }

    let cols = 0,
      rows = 0,
      W = 0,
      H = 0,
      dpr = Math.max(1, window.devicePixelRatio || 1);

    let u = new Float32Array(0),
      uPrev = new Float32Array(0),
      uNext = new Float32Array(0);

    function resize() {
      dpr = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      W = canvas.width / dpr;
      H = canvas.height / dpr;

      cols = Math.ceil(W / cellSize);
      rows = Math.ceil(H / cellSize);

      const n = cols * rows;
      u = new Float32Array(n);
      uPrev = new Float32Array(n);
      uNext = new Float32Array(n);
    }

    const idx = (x: number, y: number) => y * cols + x;

    function splash(px: number, py: number, strength: number) {
      const cx = Math.floor(px / cellSize);
      const cy = Math.floor(py / cellSize);
      const rCells = Math.ceil(brushRadius / cellSize);

      for (let y = cy - rCells; y <= cy + rCells; y++) {
        if (y < 0 || y >= rows) continue;
        for (let x = cx - rCells; x <= cx + rCells; x++) {
          if (x < 0 || x >= cols) continue;
          const gx = (x + 0.5) * cellSize;
          const gy = (y + 0.5) * cellSize;
          const dx = gx - px, dy = gy - py;
          const dist = Math.hypot(dx, dy);
          if (dist <= brushRadius) {
            const falloff = Math.exp(-(dist * dist) / (2 * (brushRadius * 0.6) ** 2));
            u[idx(x, y)] += strength * falloff;
          }
        }
      }
    }

    let lastX: number | null = null,
      lastY: number | null = null;

    function onPointerActivity(e: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      let speed = 1;
      if (lastX !== null && lastY !== null) {
        const vx = x - lastX, vy = y - lastY;
        speed = Math.min(2.0, 0.5 + Math.hypot(vx, vy) / 18);
      }
      splash(x, y, brushStrength * speed);
      lastX = x;
      lastY = y;

      // pause flash while moving
      stopFlashTimer();
      scheduleResumeFlashes();
    }

    function step() {
      // wave update
      for (let y = 1; y < rows - 1; y++) {
        for (let x = 1; x < cols - 1; x++) {
          const i = idx(x, y);
          const lap =
            u[idx(x - 1, y)] +
            u[idx(x + 1, y)] +
            u[idx(x, y - 1)] +
            u[idx(x, y + 1)] -
            4 * u[i];
          const val = 2 * u[i] - uPrev[i] + c2 * lap;
          uNext[i] = val * damping;
        }
      }

      // swap buffers
      const tmp = uPrev;
      uPrev = u;
      u = uNext;
      uNext = tmp;

      // render
      const now = performance.now();

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1;

      // Radial flash (center → fade)
      const centerX = W / 2;
      const centerY = H / 2;
      const sigma = Math.max(1, FLASH_RADIUS_PX * FLASH_SOFTNESS); // Gaussian width

      // time fade [0..1], ease-out
      const t = (now - flashStart) / flashDuration;
      const timeFade = t < 1 ? (1 - t) * (1 - t) : 0;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = idx(x, y);
          const v = Math.abs(u[i]);
          const waveBoost = maxBoost * Math.tanh(boostCurveK * v);

          // Gaussian radial boost, 1 at center, ~0 after radius
          const cx = (x + 0.5) * cellSize;
          const cy = (y + 0.5) * cellSize;
          const dist = Math.hypot(cx - centerX, cy - centerY);
          const radial = Math.exp(-(dist * dist) / (2 * sigma * sigma));

          const flashBoost = flashAlphaMax * timeFade * radial;

          let a = baseAlpha + waveBoost + flashBoost;
          if (a > 1) a = 1;

          ctx.strokeStyle = `rgba(${strokeColor[0]},${strokeColor[1]},${strokeColor[2]},${a})`;
          const rx = x * cellSize + 0.5;
          const ry = y * cellSize + 0.5;
          const s = cellSize - 1;
          ctx.strokeRect(rx, ry, s, s);
        }
      }

      ctx.restore();
      raf = requestAnimationFrame(step);
    }

    function onResize() {
      resize();
    }

    // init
    resize();
    let raf = requestAnimationFrame(step);

    // listeners
    window.addEventListener("resize", onResize);
    canvas.addEventListener("pointermove", onPointerActivity, { passive: true });
    canvas.addEventListener("pointerdown", onPointerActivity, { passive: true });

    // start flashing initially; pauses automatically on cursor move
    startFlashTimer();
    flashStart = performance.now();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      stopFlashTimer();
      if (idleTimer) window.clearTimeout(idleTimer);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointermove", onPointerActivity);
      canvas.removeEventListener("pointerdown", onPointerActivity);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black">
      <canvas ref={canvasRef} className="block w-screen h-screen" />
    </div>
  );
}
