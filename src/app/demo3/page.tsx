"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, useAnimation } from "framer-motion";
import SubtleWaterGrid from "@/components/bg";
import VercelLikeBackground from "@/components/bg_sec";

/**
 * Coming Soon / Logo Reveal (Centered Pair Step)
 * Flow without divider:
 * 1) Intro: logo is centered overlay and scales from 300vmax → 10vw
 * 2) CenterPair: AFTER the scale, both LOGO and TEXT are centered together (stacked)
 * 3) Inline: they morph into the grid; logo slides left while text settles to the right
 */

type Phase = "intro" | "centerPair" | "inline";

export default function ComingSoonReveal() {
  const [phase, setPhase] = useState<Phase>("intro");

  // Cursor light + shadow targets
  const lightRef = useRef<HTMLDivElement | null>(null);
  const darknessRef = useRef<HTMLHeadingElement | null>(null);

  // Animations
  const logo = useAnimation();
  const text = useAnimation();

  const EASE = [0.16, 1, 0.3, 1] as const;

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const x = e.pageX; // viewport + scroll safe
    const y = e.pageY;

    // Move the "Light" exactly to cursor center
    if (lightRef.current) {
      // keep -translate-x/y-1/2 classes so the light center sits at cursor
      lightRef.current.style.left = `${x}px`;
      lightRef.current.style.top = `${y}px`;
    }

    // Update text shadow (same math as original)
    if (darknessRef.current) {
      const shadowX = 30 - x / 20;
      const shadowY = -(y / 15 - 30);
      darknessRef.current.style.textShadow = `${shadowX}px ${shadowY}px 6px #ffffff10`;
    }
  }, []);

  useEffect(() => {
    async function run() {
      // 1) INTRO: scale the overlay logo down to 10vw in the center
      await logo.start({ width: window.innerWidth > 1920 ? "192px" :  "10vw", transition: { duration: 1.8, ease: EASE } });

      // 2) CENTER PAIR: bring text into view centered under the logo
      setPhase("centerPair");
      await text.start({ opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } });

      // small hold so user perceives both centered together
      await new Promise((r) => setTimeout(r, 220));

      // 3) INLINE: morph both into the grid layout and then slide/reveal smoothly
      setPhase("inline");

      await Promise.all([
        // logo slides left a bit as it docks into the grid
        logo.start({ x: "-18vw", transition: { duration: 0.9, ease: EASE } }),
        // text reveals from a gentle mask while it morphs to the right column
        text.start({
          clipPath: "inset(0% 0% 0% 0%)",
          opacity: 1,
          transition: { duration: 0.9, ease: EASE },
        }),
      ]);
      text.set({ clipPath: "none" });
    }
    run();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="min-h-screen w-full text-white flex items-center justify-center overflow-hidden p-5 "
      // onMouseMove={handleMouseMove}
    >
      <VercelLikeBackground />
      {/* Cursor-following light (fixed so it sits under cursor regardless of layout/scroll) */}
      <div
        ref={lightRef}
        className="Light pointer-events-none fixed -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: 140,
          height: 140,
          // background:
          //   "radial-gradient(circle at center, rgba(255,255,200,0.9), rgba(255,255,200,0.2) 60%, rgba(255,255,200,0) 80%)",
          filter: "blur(2px)",
          left: "-9999px", // start offscreen
          top: "-9999px",
          willChange: "left, top",
        }}
      />

      <div className="relative max-w-[1200px] w-fit px-6">
        <div className="grid grid-cols-[auto_1fr] items-center gap_div">
          {/* LOGO BLOCK */}
          {phase === "intro" ? (
            // Big centered overlay while scaling
            <motion.div
              layout
              layoutId="logo"
              initial={{ width: "300vmax" }}
              animate={logo}
              transition={{ layout: { duration: 0.6, ease: EASE } }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-20"
              style={{ willChange: "transform, width", transformOrigin: "center" }}
            >
              <div className="w-full aspect-square">
                <LogoMark />
              </div>
            </motion.div>
          ) : phase === "centerPair" ? (
            // Still overlay, but show text centered below the logo
            <>
              <motion.div
                layout
                layoutId="logo"
                animate={logo}
                transition={{ layout: { duration: 0.6, ease: EASE } }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-20"
                style={{ willChange: "transform, width", transformOrigin: "center" }}
              >
                <div className="w-[10vw] aspect-square max-w-[192px]">
                  <LogoMark />
                </div>
              </motion.div>

              <motion.div
                layout
                layoutId="copy"
                initial={{ opacity: 0, y: 0, x: 120 }}
                animate={text}
                className="fixed left-1/2 top-[50%] -translate-x-1/2 -translate-y-1/2 text-center z-20 px-6"
                style={{ willChange: "transform, opacity" }}
              >
                <h1 className="fontSize font-medium">Swarnakarshan Labs Pvt Ltd</h1>
                <p className="mt-3 text-base md:text-lg text-neutral-300">Coming&nbsp;Soon</p>
                <p className="mt-1 text-sm md:text-base text-neutral-400">
                  Building something thoughtfully crafted. Stay tuned.
                </p>
              </motion.div>
            </>
          ) : (
            // INLINE grid layout (final state)
            <motion.div
              layout
              layoutId="logo"
              animate={logo}
              transition={{ layout: { duration: 0.6, ease: EASE } }}
              className="relative flex items-center justify-center"
              style={{ willChange: "transform, width", transformOrigin: "center" }}
            >
              <div className="w-[10vw] aspect-square max-w-[192px]">
                <LogoMark />
              </div>
            </motion.div>
          )}

          {/* TEXT BLOCK in the grid (final target for the overlay copy) */}
          <motion.div
            layout
            layoutId="copy"
            initial={{ opacity: 0, clipPath: "inset(0% 100% 0% 0%)", y: 0 }}
            animate={text}
            className="md:pl-2"
          >
            <h1
              ref={darknessRef}
              className="fontSize font-medium tracking-tight uppercase"
            >
              Swarnakarshan <br />
              Labs Pvt Ltd
            </h1>
            <p className="mt-3 text-base md:text-lg text-neutral-300 hidden">
              Coming&nbsp;Soon
            </p>
            <p className="mt-1 text-sm md:text-base text-neutral-400 hidden">
              Building something thoughtfully crafted. Stay tuned.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        <span className="text-[11px] tracking-wide text-neutral-500">
          © {new Date().getFullYear()} Swarnakarshan Labs Pvt Ltd
        </span>
      </div>
    </div>
  );
}

/**
 * LogoMark: white square with centered black circle (diameter = 50% of side)
 */
function LogoMark() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="h-full w-full drop-shadow-[0_10px_40px_rgba(255,255,255,0.08)]"
      role="img"
      aria-label="Swarnakarshan Labs logo"
    >
      <rect x="0" y="0" width="100" height="100" fill="#000000" />
      <circle cx="50" cy="50" r="25" fill="#ffffff" />
    </svg>
  );
}
