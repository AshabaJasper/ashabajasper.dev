"use client";

import { useEffect, useRef } from "react";

const SPACING = 24;
const REACH = 190;

function readColors(el: HTMLElement) {
  const style = getComputedStyle(el);
  return {
    dot: style.getPropertyValue("--grid-dot").trim() || "rgb(128 128 128 / 0.1)",
    accent: style.getPropertyValue("--primary").trim() || "#3ddc97",
  };
}

/**
 * A generative dot grid drawn on a 2D canvas: a slow interference wave runs
 * through it, and dots near the cursor swell and take the accent colour.
 * Decorative and aria-hidden. Loaded lazily, it pauses when off screen or in
 * a background tab, and is never mounted under reduced motion (see Backdrop).
 */
export default function GenerativeGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let colors = readColors(document.documentElement);
    const pointer = { x: -9999, y: -9999, strength: 0 };
    let visible = true;
    let frame = 0;
    let last = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now: number) => {
      frame = 0;
      if (!visible || document.hidden) return;
      const t = now / 1000;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;
      // Ease the cursor's influence in and out.
      pointer.strength += ((pointer.x > -999 ? 1 : 0) - pointer.strength) * Math.min(1, dt * 6);

      ctx.clearRect(0, 0, width, height);
      const cols = Math.ceil(width / SPACING) + 1;
      const rows = Math.ceil(height / SPACING) + 1;
      const offsetX = (width - (cols - 1) * SPACING) / 2;
      for (let r = 0; r < rows; r++) {
        const y = r * SPACING;
        for (let c = 0; c < cols; c++) {
          const x = offsetX + c * SPACING;
          const wave = Math.sin(x * 0.012 + t * 0.6) * Math.cos(y * 0.016 - t * 0.45);
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const near = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / REACH) * pointer.strength;
          const size = 1.1 + wave * 0.45 + near * 2.4;
          if (near > 0.05) {
            ctx.globalAlpha = Math.min(1, 0.25 + near);
            ctx.fillStyle = colors.accent;
          } else {
            ctx.globalAlpha = 0.75 + wave * 0.25;
            ctx.fillStyle = colors.dot;
          }
          ctx.fillRect(x - size / 2, y - size / 2, size, size);
        }
      }
      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(draw);
    };

    const start = () => {
      if (!frame && visible && !document.hidden) {
        last = 0;
        frame = requestAnimationFrame(draw);
      }
    };

    const onPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      if (pointer.y < -REACH || pointer.y > rect.height + REACH) pointer.x = pointer.y = -9999;
    };
    const onLeave = () => {
      pointer.x = pointer.y = -9999;
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    io.observe(canvas);
    const themeObserver = new MutationObserver(() => {
      colors = readColors(document.documentElement);
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    const onVisibility = () => start();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    start();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      io.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointer);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="absolute inset-0 size-full" />;
}
