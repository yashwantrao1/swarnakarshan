'use client'
import React, { useEffect, useLayoutEffect, useRef } from "react";
import { gsap } from 'gsap';

const Page = () => {
    const boxRef = useRef<HTMLDivElement | null>(null);
    const tlRef = useRef<gsap.core.Timeline | null>(null);
    useLayoutEffect(() => {
    // Scope GSAP to this component and clean up on unmount
    const ctx = gsap.context(() => {
      tlRef.current = gsap
        .timeline()
        .to(boxRef.current, {
          duration: 0.5,
          rotation: 90,
          delay: 1,
          transformOrigin: '100% 100%',
        })
        .set(boxRef.current, {
          // Use translate x instead of "left" for smoother transforms
          x: 104,
          rotation: 0,
        })
        .to(boxRef.current, {
          duration: 0.5,
          rotation: 90,
          delay: 1,
          transformOrigin: '100% 100%',
        });
    }, boxRef);

    return () => ctx.revert();
  }, []);

    return (
        <div className="relative flex h-screen items-center justify-center bg-black overflow-hidden">

            {/* CONTENT — stays fully visible; the overlay above will “mask” it */}
            <div className="grid grid-cols-[auto_1fr] items-center gap-6 opacity-50">
                <div className="w-[10vw] max-w-[192px]">
                    <LogoMark />
                </div>
                <h1 className="text-white uppercase tracking-wide leading-tight text-[clamp(24px,6vw,64px)] opacity-50">
                    Swarnakarshan <br /> Labs Pvt Ltd
                </h1>
            </div>
            <div className="grid grid-cols-[auto_1fr] items-center gap-6 absolute">
                <div className="w-[10vw] max-w-[192px] rotate-12 border-0" id="square1" ref={boxRef}>
                    <LogoMark />
                </div>
                <h1 className="text-white uppercase tracking-wide leading-tight text-[clamp(24px,6vw,64px)] translate-x-2.5">
                    Swarnakarshan <br /> Labs Pvt Ltd
                </h1>
            </div>

            {/* BLACK OVERLAY WITH A GROWING HOLE (the hole is where the ball is) */}
            <div className="reveal-overlay pointer-events-none" />

            {/* THE BALL / LIGHT SOURCE */}
            <div className="light-ball" aria-hidden />
        </div>
    );
};

export default Page;

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
