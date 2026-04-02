'use client';

import { useEffect, useRef } from 'react';

interface Props {
  isActive: boolean;
  isFlashing: boolean;
}

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  color: string;
  life: number;
  maxLife: number;
};

const VOID_COLORS = ['#7c3aed', '#6d28d9', '#a78bfa', '#c4b5fd', '#818cf8', '#ffffff'];

function spawnParticle(w: number, h: number): Particle {
  const maxLife = 90 + Math.random() * 120;
  return {
    x: Math.random() * w,
    y: h * (0.2 + Math.random() * 0.8),
    vx: (Math.random() - 0.5) * 0.7,
    vy: -(0.25 + Math.random() * 0.75),
    radius: 0.5 + Math.random() * 2.2,
    opacity: 0.45 + Math.random() * 0.55,
    color: VOID_COLORS[Math.floor(Math.random() * VOID_COLORS.length)],
    life: 0,
    maxLife,
  };
}

export default function VoidModeOverlay({ isActive, isFlashing }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const isActiveRef = useRef(isActive);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth || 640;
      canvas.height = canvas.offsetHeight || 360;
    };
    resize();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const tick = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (isActiveRef.current) {
        while (particlesRef.current.length < 68) {
          particlesRef.current.push(spawnParticle(w, h));
        }

        particlesRef.current = particlesRef.current.filter((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.life += 1;

          const t = p.life / p.maxLife;
          const alpha = p.opacity * (t < 0.15 ? t / 0.15 : t > 0.75 ? (1 - t) / 0.25 : 1);

          ctx.save();
          ctx.globalAlpha = Math.max(0, alpha);
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          return p.life < p.maxLife && p.y > -20;
        });
      } else {
        particlesRef.current = particlesRef.current.filter((p) => {
          p.x += p.vx;
          p.y += p.vy;
          p.life += 3;

          const t = p.life / p.maxLife;
          const alpha = p.opacity * (t > 0.6 ? (1 - t) / 0.4 : 1) * 0.5;

          ctx.save();
          ctx.globalAlpha = Math.max(0, alpha);
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 4;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          return p.life < p.maxLife && p.y > -20;
        });
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <div
      className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${isActive ? 'opacity-100' : 'opacity-0'}`}
      aria-hidden="true"
    >
      {/* Dark cosmic base */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(109,40,217,0.5)_0%,rgba(30,27,75,0.72)_50%,rgba(0,0,10,0.88)_100%)]" />

      {/* Pulsing energy glow */}
      <div className="void-pulse-glow absolute inset-0" />

      {/* Expanding rings */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="void-ring" style={{ animationDelay: '0s' }} />
        <div className="void-ring void-ring-blue" style={{ animationDelay: '1.4s' }} />
        <div className="void-ring void-ring-soft" style={{ animationDelay: '2.8s' }} />
      </div>

      {/* Particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Activation flash */}
      <div
        className="absolute inset-0 bg-violet-300 transition-opacity duration-200"
        style={{ opacity: isFlashing ? 0.2 : 0 }}
      />
    </div>
  );
}
