"use client";
import { useEffect, useId } from "react";

export default function VercelLikeBackground({
  intensity = 1,
  gridOpacity = 0.12,
  respectReducedMotion = true,
  // optional overrides
  lightColor = "#DCDCDC", // gainsboro
  darkColor = "#000000",  // black
}: {
  intensity?: number;
  gridOpacity?: number;
  respectReducedMotion?: boolean;
  lightColor?: string;
  darkColor?: string;
}) {
  const clampedIntensity = Math.max(0, Math.min(1.5, intensity));
  const clampedGridOpacity = Math.max(0, Math.min(0.4, gridOpacity));
  const uid = useId();

  useEffect(() => {
    if (!respectReducedMotion) return;
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const root = document.documentElement;
    const apply = () => {
      if (m.matches) {
        root.style.setProperty("--aurora-motion", "paused");
        root.style.setProperty("--aurora-duration", "1ms");
      } else {
        root.style.setProperty("--aurora-motion", "running");
        root.style.setProperty("--aurora-duration", "28s");
      }
    };
    apply();
    m.addEventListener("change", apply);
    return () => m.removeEventListener("change", apply);
  }, [respectReducedMotion]);

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1200 800"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <filter id={`blur-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={60 * clampedIntensity} />
          </filter>

          <radialGradient id={`fade-${uid}`} cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#fff" stopOpacity="1" />
            <stop offset="90%" stopColor="#fff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>

          {/* Grid pattern in gainsboro */}
          <pattern id={`grid-${uid}`} width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke={lightColor}
              strokeOpacity={clampedGridOpacity}
            />
          </pattern>

          {/* Monochrome gradients (gainsboro -> black) */}
          <radialGradient id={`g1-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={lightColor} />
            <stop offset="100%" stopColor={darkColor} />
          </radialGradient>
          <radialGradient id={`g2-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={lightColor} />
            <stop offset="100%" stopColor={darkColor} />
          </radialGradient>
          <radialGradient id={`g3-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={lightColor} />
            <stop offset="100%" stopColor={darkColor} />
          </radialGradient>

          {/* Stroke gradient (subtle gainsboro fade) */}
          <linearGradient id={`stroke-${uid}`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor={lightColor} stopOpacity="0.18" />
            <stop offset="100%" stopColor={lightColor} stopOpacity="0.02" />
          </linearGradient>

          <mask id={`mask-${uid}`}>
            <rect width="100%" height="100%" fill={`url(#fade-${uid})`} />
          </mask>
        </defs>

        {/* very subtle tint; keep 0 opacity if you want pure black base */}
        <rect width="100%" height="100%" fill={`url(#g2-${uid})`} opacity="0.0" />

        <g mask={`url(#mask-${uid})`}>
          <rect width="1200" height="800" fill={`url(#grid-${uid})`} />
          <path d="M -200 900 L 1400 -100" fill="none" stroke={`url(#stroke-${uid})`} strokeWidth="1" />
        </g>

        {/* Use screen blend to let gainsboro glow over black */}
        <g filter={`url(#blur-${uid})`} style={{ mixBlendMode: "screen" }}>
          <g className="aurora aurora-a">
            <circle r={220} cx="300" cy="300" fill={`url(#g1-${uid})`} opacity={0.85 * clampedIntensity} />
          </g>
          <g className="aurora aurora-b">
            <circle r={260} cx="900" cy="500" fill={`url(#g2-${uid})`} opacity={0.75 * clampedIntensity} />
          </g>
          <g className="aurora aurora-c">
            <circle r={200} cx="650" cy="200" fill={`url(#g3-${uid})`} opacity={0.9 * clampedIntensity} />
          </g>
        </g>

        {/* vignette */}
        <rect width="1200" height="800" fill="#000" opacity="0.35" mask={`url(#mask-${uid})`} />
      </svg>

      <style>{`
        :root { --aurora-duration: 28s; --aurora-motion: running; }
        .aurora {
          animation-duration: var(--aurora-duration);
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
          animation-play-state: var(--aurora-motion);
          will-change: transform, opacity;
        }
        .aurora-a { animation-name: driftA; }
        .aurora-b { animation-name: driftB; }
        .aurora-c { animation-name: driftC; }
        @keyframes driftA {
          0% { transform: translate3d(-40px, 0, 0) scale(1); }
          50% { transform: translate3d(60px, -30px, 0) scale(1.08); }
          100% { transform: translate3d(-40px, 0, 0) scale(1); }
        }
        @keyframes driftB {
          0% { transform: translate3d(30px, 20px, 0) scale(1); }
          50% { transform: translate3d(-80px, -40px, 0) scale(1.12); }
          100% { transform: translate3d(30px, 20px, 0) scale(1); }
        }
        @keyframes driftC {
          0% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(40px, 50px, 0) scale(0.95); }
          100% { transform: translate3d(0, 0, 0) scale(1); }
        }
        @media (min-width: 1280px) {
          .aurora-a circle { r: 280px; }
          .aurora-b circle { r: 320px; }
          .aurora-c circle { r: 260px; }
        }
      `}</style>
    </div>
  );
}
