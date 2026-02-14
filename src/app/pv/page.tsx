"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const PHOTOS = [
  "https://picsum.photos/seed/tarie1/800/1200",
  "https://picsum.photos/seed/tarie2/1200/800",
  "https://picsum.photos/seed/tarie3/800/1000",
  "https://picsum.photos/seed/tarie4/1000/800",
  "https://picsum.photos/seed/tarie5/800/1200",
  "https://picsum.photos/seed/tarie6/1200/900",
  "https://picsum.photos/seed/tarie7/900/1200",
  "https://picsum.photos/seed/tarie8/1200/800",
];

interface FloatingPhoto {
  img: HTMLImageElement;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  rotation: number;
  rotationV: number;
  scale: number;
  targetScale: number;
  opacity: number;
  targetOpacity: number;
  width: number;
  height: number;
  driftPhase: number;
  driftSpeed: number;
  driftAmplitudeX: number;
  driftAmplitudeY: number;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

type Phase =
  | "loading"
  | "black"
  | "drift"
  | "converge"
  | "spread-1"
  | "spread-2"
  | "spread-3"
  | "text-1"
  | "text-2"
  | "text-3"
  | "tagline"
  | "end";

export default function PVPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photosRef = useRef<FloatingPhoto[]>([]);
  const phaseRef = useRef<Phase>("loading");
  const [overlayPhase, setOverlayPhase] = useState<Phase>("loading");
  const [loadedCount, setLoadedCount] = useState(0);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const frameRef = useRef(0);
  const readyRef = useRef(false);

  // Preload
  useEffect(() => {
    let count = 0;
    const imgs: HTMLImageElement[] = [];
    for (const src of PHOTOS) {
      const img = document.createElement("img");
      img.crossOrigin = "anonymous";
      img.src = src;
      imgs.push(img);
      const done = () => {
        count++;
        setLoadedCount(count);
      };
      img.onload = done;
      img.onerror = done;
    }
    imagesRef.current = imgs;
  }, []);

  const go = useCallback((next: Phase, ms: number) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      phaseRef.current = next;
      setOverlayPhase(next);
    }, ms);
  }, []);

  // Start once loaded
  useEffect(() => {
    if (loadedCount < PHOTOS.length || readyRef.current) return;
    readyRef.current = true;

    // Small delay then start
    setTimeout(() => {
      phaseRef.current = "black";
      setOverlayPhase("black");
    }, 200);
  }, [loadedCount]);

  // Canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };
    resize();
    window.addEventListener("resize", resize);

    const ctx = canvas.getContext("2d")!;

    const animate = () => {
      const currentDpr = window.devicePixelRatio || 1;
      const W = canvas.width / currentDpr;
      const H = canvas.height / currentDpr;
      ctx.setTransform(currentDpr, 0, 0, currentDpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const phase = phaseRef.current;
      const ease = phase === "converge" ? 0.015 : 0.03;

      for (const p of photosRef.current) {
        const drifting =
          phase === "drift" ||
          phase === "converge" ||
          phase === "spread-1" ||
          phase === "spread-2" ||
          phase === "spread-3";

        if (drifting) {
          p.driftPhase += p.driftSpeed * 0.016;
        }

        const driftX = Math.sin(p.driftPhase) * p.driftAmplitudeX;
        const driftY = Math.cos(p.driftPhase * 0.7 + 1) * p.driftAmplitudeY;

        p.x = lerp(p.x, p.targetX + (drifting ? driftX : 0), ease);
        p.y = lerp(p.y, p.targetY + (drifting ? driftY : 0), ease);
        p.scale = lerp(p.scale, p.targetScale, 0.03);
        p.opacity = lerp(p.opacity, p.targetOpacity, 0.03);
        p.rotation += p.rotationV;
        p.rotationV *= 0.997;
        p.rotation = lerp(p.rotation, 0, 0.005);

        if (p.opacity < 0.005) continue;

        ctx.save();
        ctx.globalAlpha = Math.min(p.opacity, 1);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.scale(p.scale, p.scale);

        const w = p.width;
        const h = p.height;

        ctx.shadowColor = "rgba(0,0,0,0.15)";
        ctx.shadowBlur = 30;
        ctx.shadowOffsetY = 10;

        ctx.drawImage(p.img, -w / 2, -h / 2, w, h);
        ctx.restore();
      }

      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Initialize floating photos when images are ready
  useEffect(() => {
    if (loadedCount < PHOTOS.length) return;
    if (photosRef.current.length > 0) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const photoSize = Math.min(vw, vh) * 0.2;

    photosRef.current = imagesRef.current.map((img, i) => {
      const angle = (i / PHOTOS.length) * Math.PI * 2 + Math.random() * 0.8;
      const radius = Math.max(vw, vh) * 0.7;
      return {
        img,
        x: vw / 2 + Math.cos(angle) * radius,
        y: vh / 2 + Math.sin(angle) * radius,
        targetX: vw * 0.15 + Math.random() * vw * 0.7,
        targetY: vh * 0.15 + Math.random() * vh * 0.7,
        rotation: (Math.random() - 0.5) * 40,
        rotationV: (Math.random() - 0.5) * 0.4,
        scale: 0.1,
        targetScale: 0.7 + Math.random() * 0.5,
        opacity: 0,
        targetOpacity: 0,
        width: photoSize * (img.naturalWidth > img.naturalHeight ? 1.4 : 0.9),
        height: photoSize * (img.naturalHeight > img.naturalWidth ? 1.4 : 0.9),
        driftPhase: Math.random() * Math.PI * 2,
        driftSpeed: 0.4 + Math.random() * 0.5,
        driftAmplitudeX: 20 + Math.random() * 30,
        driftAmplitudeY: 15 + Math.random() * 25,
      };
    });
  }, [loadedCount]);

  // Phase sequencing
  useEffect(() => {
    const floaters = photosRef.current;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (overlayPhase === "black") {
      go("drift", 800);
    }

    if (overlayPhase === "drift") {
      for (const p of floaters) {
        p.targetOpacity = 1;
      }
      go("converge", 4000);
    }

    if (overlayPhase === "converge") {
      for (const p of floaters) {
        p.targetX = vw / 2 + (Math.random() - 0.5) * 80;
        p.targetY = vh / 2 + (Math.random() - 0.5) * 80;
        p.targetScale = 0.2;
        p.targetOpacity = 0;
        p.driftAmplitudeX = 4;
        p.driftAmplitudeY = 4;
      }
      go("text-1", 2200);
    }

    if (overlayPhase === "text-1") {
      go("spread-1", 3000);
    }

    if (overlayPhase === "spread-1") {
      const gap = Math.min(vw * 0.02, 16);
      const photoW = Math.min(vw * 0.35, 280);
      const photoH = photoW * 1.3;
      const pair = [floaters[0], floaters[1]];
      if (pair[0] && pair[1]) {
        for (let j = 0; j < 2; j++) {
          pair[j].targetX = vw / 2 + (j === 0 ? -1 : 1) * (photoW / 2 + gap);
          pair[j].targetY = vh / 2;
          pair[j].targetScale = 1;
          pair[j].targetOpacity = 1;
          pair[j].width = photoW;
          pair[j].height = photoH;
          pair[j].driftAmplitudeX = 4;
          pair[j].driftAmplitudeY = 3;
        }
      }
      go("spread-2", 3200);
    }

    if (overlayPhase === "spread-2") {
      if (floaters[0]) floaters[0].targetOpacity = 0;
      if (floaters[1]) floaters[1].targetOpacity = 0;

      const gap = Math.min(vw * 0.02, 16);
      const photoW = Math.min(vw * 0.35, 280);
      const photoH = photoW * 1.3;
      const pair = [floaters[2], floaters[3]];
      if (pair[0] && pair[1]) {
        for (let j = 0; j < 2; j++) {
          pair[j].targetX = vw / 2 + (j === 0 ? -1 : 1) * (photoW / 2 + gap);
          pair[j].targetY = vh / 2;
          pair[j].targetScale = 1;
          pair[j].targetOpacity = 1;
          pair[j].width = photoW;
          pair[j].height = photoH;
          pair[j].driftAmplitudeX = 4;
          pair[j].driftAmplitudeY = 3;
        }
      }
      go("spread-3", 3200);
    }

    if (overlayPhase === "spread-3") {
      if (floaters[2]) floaters[2].targetOpacity = 0;
      if (floaters[3]) floaters[3].targetOpacity = 0;

      const gap = Math.min(vw * 0.02, 16);
      const photoW = Math.min(vw * 0.35, 280);
      const photoH = photoW * 1.3;
      const pair = [floaters[4], floaters[5]];
      if (pair[0] && pair[1]) {
        for (let j = 0; j < 2; j++) {
          pair[j].targetX = vw / 2 + (j === 0 ? -1 : 1) * (photoW / 2 + gap);
          pair[j].targetY = vh / 2;
          pair[j].targetScale = 1;
          pair[j].targetOpacity = 1;
          pair[j].width = photoW;
          pair[j].height = photoH;
          pair[j].driftAmplitudeX = 4;
          pair[j].driftAmplitudeY = 3;
        }
      }
      go("text-2", 3200);
    }

    if (overlayPhase === "text-2") {
      for (const p of floaters) p.targetOpacity = 0;
      go("text-3", 3800);
    }

    if (overlayPhase === "text-3") {
      go("tagline", 3800);
    }

    if (overlayPhase === "tagline") {
      go("end", 4000);
    }
  }, [overlayPhase, go]);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  const isWhiteBg =
    overlayPhase !== "loading" &&
    overlayPhase !== "black";

  return (
    <div
      className="fixed inset-0 overflow-hidden select-none cursor-default transition-colors duration-1000"
      style={{ backgroundColor: isWhiteBg ? "#fafaf9" : "#0c0a09" }}
    >
      <canvas ref={canvasRef} className="fixed inset-0" />

      {/* Loading */}
      {overlayPhase === "loading" && (
        <div className="fixed inset-0 flex items-center justify-center z-20">
          <div className="text-white/20 text-sm tracking-widest">
            {loadedCount}/{PHOTOS.length}
          </div>
        </div>
      )}

      {/* Text overlays */}
      <TextOverlay
        visible={overlayPhase === "text-1"}
        text="Every day, billions of photos are taken."
        sub="Most of them disappear."
      />

      <TextOverlay
        visible={
          overlayPhase === "spread-1" ||
          overlayPhase === "spread-2" ||
          overlayPhase === "spread-3"
        }
        text="But when you place two photos side by side,"
        sub="something appears between them."
        position="bottom"
      />

      <TextOverlay
        visible={overlayPhase === "text-2"}
        text="No likes. No feed. No algorithm."
        sub="Just the order you chose."
      />

      <TextOverlay
        visible={overlayPhase === "text-3"}
        text="One URL. One book."
        sub="For someone specific."
      />

      {/* Tagline */}
      {(overlayPhase === "tagline" || overlayPhase === "end") && (
        <div className="fixed inset-0 flex flex-col items-center justify-center gap-6 px-6 z-10">
          <h1 className="font-[var(--font-playfair-display)] text-5xl md:text-7xl text-stone-900 font-semibold tracking-tight pv-fadein">
            tarie
          </h1>
          <p className="text-stone-400 text-base md:text-lg text-center max-w-sm leading-relaxed pv-fadein-delay">
            A home for photos that don&apos;t go viral
          </p>
          {overlayPhase === "end" && (
            <a
              href="https://www.tarie.art/about"
              className="mt-6 text-stone-300 text-sm tracking-[0.2em] hover:text-stone-500 transition-colors pv-fadein-delay2"
            >
              tarie.art
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Text Overlay ─── */

function TextOverlay({
  visible,
  text,
  sub,
  position = "center",
}: {
  visible: boolean;
  text: string;
  sub?: string;
  position?: "center" | "bottom";
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (visible) {
      const t = setTimeout(() => setShow(true), 100);
      return () => clearTimeout(t);
    }
    setShow(false);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-x-0 z-10 flex flex-col items-center gap-3 px-8 ${
        position === "bottom" ? "bottom-[12%]" : "inset-y-0 justify-center"
      }`}
    >
      <p
        className="text-stone-700 text-lg md:text-2xl text-center max-w-lg leading-relaxed font-light"
        style={{
          opacity: show ? 1 : 0,
          transform: show ? "translateY(0)" : "translateY(16px)",
          transition: "all 1.2s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {text}
      </p>
      {sub && (
        <p
          className="text-stone-400 text-sm md:text-base text-center max-w-md"
          style={{
            opacity: show ? 1 : 0,
            transform: show ? "translateY(0)" : "translateY(10px)",
            transition: "all 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.4s",
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}
