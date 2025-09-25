"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { vertexShader, fragmentShader } from "@/src/app/shaders/distort"; // move shaders under /app or /src

const Page = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const container = containerRef.current!;
    const canvas = canvasRef.current!;
    const img = imgRef.current!;

    // --- Three.js basics ---
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 2);

    const clock = new THREE.Clock();

    // --- Create texture from the <img> element already in the DOM ---
    const textureFromImg = () => {
      const tex = new THREE.Texture(img);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      tex.needsUpdate = true; // critical when using HTMLImageElement
      return tex;
    };

    // --- Displacement data texture (driven by mouse) ---
    const SIZE = 104; // keep small for perf
    const isWebGL2 = (renderer.getContext() as WebGL2RenderingContext | null)?.TEXTURE_BINDING_2D !== undefined;
    const data = new Float32Array(SIZE * SIZE * 10);
    const dataTex = new THREE.DataTexture(
      data,
      SIZE,
      SIZE,
      THREE.RGBAFormat,
      isWebGL2 ? THREE.FloatType : THREE.UnsignedByteType
    );
    dataTex.needsUpdate = true;

    // Uniforms expected by your shader
    const uniforms = {
      time: { value: 0 },
      progress: { value: 0 },
      uDataTexture: { value: dataTex },
      uTexture: { value: null as unknown as THREE.Texture },
      resolution: { value: new THREE.Vector4(1, 1, 1, 1) }, // xy: viewport, zw: cover scale
    };

    // Mesh
    const geometry = new THREE.PlaneGeometry(2, 1, 64, 64);
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // --- Fit and cover helpers ---
    const setResolution = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();

      // cover scaling based on image aspect
      const imgW = (img.naturalWidth || 1);
      const imgH = (img.naturalHeight || 1);
      const imgAspect = imgW / imgH;
      const viewAspect = w / h;
      let coverX = 1, coverY = 1;
      if (viewAspect > imgAspect) {
        // viewport wider → stretch X
        coverX = viewAspect / imgAspect;
        coverY = 1;
      } else {
        // viewport taller → stretch Y
        coverX = 1;
        coverY = imgAspect / viewAspect;
      }
      uniforms.resolution.value.set(w, h, coverX, coverY);
    };

    const ro = new ResizeObserver(setResolution);
    ro.observe(container);

    // --- Pointer → write to data texture ---
    let pointer = { x: 0.5, y: 0.5, down: false };
    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = (e.clientX - rect.left) / rect.width;
      pointer.y = 1 - (e.clientY - rect.top) / rect.height; // flip Y for UV space
      pointer.down = true;
    };
    const onPointerLeave = () => (pointer.down = false);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerleave", onPointerLeave);

    // Write a soft impulse around the pointer each frame, with decay
    const writeImpulse = () => {
      // decay
      for (let i = 0; i < data.length; i++) data[i] *= 0.96;
      if (!pointer.down) return;
      const radius = 0.12; // in UV space
      const amp = 1.0;
      for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
          const u = x / (SIZE - 1);
          const v = y / (SIZE - 1);
          const dx = u - pointer.x;
          const dy = v - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < radius * radius) {
            const falloff = Math.exp(-d2 / (radius * radius * 0.25));
            const idx = (y * SIZE + x) * 4;
            // encode vector field in RG
            data[idx + 0] += (-dx) * amp * falloff; // R: x push
            data[idx + 1] += (-dy) * amp * falloff; // G: y push
            data[idx + 2] = 0;
            data[idx + 3] = 1;
          }
        }
      }
      dataTex.needsUpdate = true;
    };

    // --- Render loop ---
    let rafId = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      uniforms.time.value = clock.getElapsedTime();
      writeImpulse();
      renderer.render(scene, camera);
    };

    // Ensure the <img> is loaded, then start
    const start = () => {
      uniforms.uTexture.value = textureFromImg();
      setResolution();
      animate();
    };

    if (img.complete && img.naturalWidth > 0) {
      start();
    } else {
      img.addEventListener("load", start, { once: true });
      img.addEventListener("error", () => {
        // fallback to a 1x1 white so you at least see a plane
        const fallback = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1, THREE.RGBAFormat);
        fallback.needsUpdate = true;
        uniforms.uTexture.value = fallback as unknown as THREE.Texture;
        setResolution();
        animate();
      }, { once: true });
    }

    // Cleanup
    return () => {
      cancelAnimationFrame(rafId);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
      ro.disconnect();
      geometry.dispose();
      material.dispose();
      (uniforms.uTexture.value as THREE.Texture | null)?.dispose?.();
      dataTex.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative demo2 flex items-center justify-center h-screen w-full bg-black overflow-hidden">
      {/* Your image is in the DOM and used as the WebGL texture */}
      <img ref={imgRef} src="/slpl.png" alt="SLPL" className="absolute inset-0 h-52 w-auto object-contain opacity-0 pointer-events-none" />
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};

export default Page;
