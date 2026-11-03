'use client';

import { useEffect, useRef } from 'react';
import { DEKO } from '../../einstellungen/deko';

export default function Schnee() {
  const canvas = useRef(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const element = canvas.current;
    const context = element.getContext('2d');
    let width = 0;
    let height = 0;
    const resize = () => {
      width = element.clientWidth;
      height = element.clientHeight;
      element.width = width;
      element.height = height;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();

    const flakes = Array.from({ length: DEKO.schneeflocken }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.7 + Math.random() * 1.9,
      speed: 0.22 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
    }));

    let frame = 0;
    const draw = () => {
      context.clearRect(0, 0, width, height);
      context.fillStyle = 'rgba(255, 252, 244, 0.75)';
      for (const f of flakes) {
        f.y += f.speed;
        f.x += Math.sin(f.y * 0.012 + f.phase) * 0.28;
        if (f.y > height + 4) {
          f.y = -4;
          f.x = Math.random() * width;
        }
        context.beginPath();
        context.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        context.fill();
      }
      if (!reduced) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvas} className="snow" aria-hidden="true" />;
}
