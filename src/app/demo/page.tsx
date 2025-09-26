"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, useAnimation } from "framer-motion";
// import SubtleWaterGrid from "@/components/bg";

/**
 * Coming Soon / Logo Reveal (Square Roll → Stop (center) → Reveal)
 * Flow:
 * 1) roll: the square logo tumbles in from the left and stops PERFECTLY CENTERED
 * 2) inline: we morph into the grid layout while the text reveals
 */

type Phase = "roll" | "inline";

export default function Main() {
  const [phase, setPhase] = useState<Phase>("roll");

  const lightRef = useRef<HTMLDivElement | null>(null);
  const darknessRef = useRef<HTMLHeadingElement | null>(null);

  // Animations
  const logo = useAnimation();
  const text = useAnimation();

  const EASE = [0.16, 1, 0.3, 1] as const;

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const x = e.pageX;
    const y = e.pageY;

    if (lightRef.current) {
      lightRef.current.style.left = `${x}px`;
      lightRef.current.style.top = `${y}px`;
    }

    if (darknessRef.current) {
      const shadowX = 30 - x / 20;
      const shadowY = -(y / 15 - 30);
      darknessRef.current.style.textShadow = `${shadowX}px ${shadowY}px 6px #ffffff10`;
    }
  }, []);

  useEffect(() => {
    async function run() {
      // 1) Roll in and stop centered on screen
      await logo.start({
        x: ["-60vw", "-45vw", "-30vw", "-15vw", "0vw"], // relative to the centered overlay container
        rotate: [-360, -270, -180, -90, 0],
        transition: {
          duration: 2.4,
          times: [0, 0.25, 0.5, 0.75, 1],
          ease: "easeInOut",
        },
      });

      // a small hold for perception
      await new Promise((r) => setTimeout(r, 220));

      // 2) Switch to inline layout and reveal the text as the logo docks into the grid
      setPhase("inline");

      await Promise.all([
        // Gentle layout morph is handled by Framer Motion's layoutId + transition below.
        text.start({
          opacity: 1,
          clipPath: "inset(0% 0% 0% 0%)",
          transition: { duration: 0.9, ease: EASE },
        }),
      ]);

      // clean up mask
      text.set({ clipPath: "none" });
    }

    run();
  }, []);

  return (
    <div
      className="min-h-screen w-full bg-black text-white flex items-center justify-center overflow-hidden p-5"
      // onMouseMove={handleMouseMove}
    >
      {/* <SubtleWaterGrid /> */}

      {/* Cursor-following light (kept; styles muted by default) */}
      <div
        ref={lightRef}
        className="Light pointer-events-none fixed -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: 140,
          height: 140,
          filter: "blur(2px)",
          left: "-9999px",
          top: "-9999px",
          willChange: "left, top",
        }}
      />

      <div className="relative max-w-[1200px] w-fit px-6">
        <div className="grid grid-cols-[auto_1fr] items-center gap-x-6">
          {/* LOGO BLOCK */}
          <motion.div
            layout
            layoutId="logo"
            animate={logo}
            initial={{ x: "-60vw", rotate: -360 }}
            transition={{ layout: { duration: 0.6, ease: EASE } }}
            className={
              phase === "roll"
                ? // During the roll, the logo lives in an OVERLAY centered container
                  "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center"
                : // After the roll, it docks back into the grid cell
                  "relative z-20 flex items-center justify-center"
            }
            style={{ willChange: "transform", transformOrigin: "center" }}
          >
            <div className="w-[10vw] max-w-[192px] aspect-square">
              <LogoMark />
            </div>
          </motion.div>

          {/* TEXT BLOCK (reveals after the roll stops) */}
          <motion.div
            layout
            layoutId="copy"
            initial={{ opacity: 0, clipPath: "inset(0% 100% 0% 0%)", y: 0 }}
            animate={text}
            className="md:pl-2"
          >
            <h1 ref={darknessRef} className="fontSize font-medium tracking-tight uppercase">
              Swarnakarshan <br />
              Labs Pvt Ltd
            </h1>
            {/* <p className="mt-3 text-base md:text-lg text-neutral-300">Coming&nbsp;Soon</p>
            <p className="mt-1 text-sm md:text-base text-neutral-400">
              Building something thoughtfully crafted. Stay tuned.
            </p> */}
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
      <rect x="0" y="0" width="100" height="100" fill="white" />
      <circle cx="50" cy="50" r="25" fill="#000000" />
    </svg>
  );
}
