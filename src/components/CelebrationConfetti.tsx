import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  decay: number;
  gravity: number;
}

interface CelebrationConfettiProps {
  onComplete?: () => void;
  active: boolean;
  variant?: 'full' | 'subtle';
}

export default function CelebrationConfetti({ onComplete, active, variant = 'full' }: CelebrationConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    // Resize canvas
    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    // Vibrant celebration colors
    const colors = [
      '#10B981', // emerald-500
      '#3B82F6', // blue-500
      '#8B5CF6', // violet-500
      '#EC4899', // pink-500
      '#F59E0B', // amber-500
      '#6EE7B7', // emerald-300
      '#A78BFA', // violet-400
    ];

    // Generate confetti burst
    const createParticle = (x: number, y: number, angle: number, spread: number): Particle => {
      const velocity = 15 + Math.random() * 20;
      const radAngle = (angle + (Math.random() - 0.5) * spread) * (Math.PI / 180);
      
      return {
        x,
        y,
        size: 5 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: Math.cos(radAngle) * velocity,
        speedY: Math.sin(radAngle) * velocity,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
        decay: 0.006 + Math.random() * 0.008,
        gravity: 0.35 + Math.random() * 0.25,
      };
    };

    // Initialize bursts
    const initBursts = () => {
      if (variant === 'subtle') {
        // Localized pop originating right below the header bar, at the top center
        const startX = canvas.width / 2;
        const startY = 60; // Just under the progress header

        // Fewer, smaller particles with gentle physics
        for (let i = 0; i < 45; i++) {
          const velocity = 4 + Math.random() * 7;
          const angle = 45 + Math.random() * 90; // Spread downwards-ish
          const radAngle = angle * (Math.PI / 180);

          particles.push({
            x: startX,
            y: startY,
            size: 3 + Math.random() * 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            speedX: Math.cos(radAngle) * velocity * (Math.random() > 0.5 ? 1 : -1),
            speedY: Math.sin(radAngle) * velocity,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 12,
            opacity: 1,
            decay: 0.014 + Math.random() * 0.012, // Decays faster
            gravity: 0.15 + Math.random() * 0.1,
          });
        }
        return;
      }

      const leftX = 0;
      const rightX = canvas.width;
      const bottomY = canvas.height;

      // Burst from left upwards and right
      for (let i = 0; i < 90; i++) {
        particles.push(createParticle(leftX, bottomY - 20, -45, 45));
      }

      // Burst from right upwards and left
      for (let i = 0; i < 90; i++) {
        particles.push(createParticle(rightX, bottomY - 20, -135, 45));
      }

      // Centered ambient sparkle bursts
      for (let i = 0; i < 40; i++) {
        particles.push({
          x: canvas.width / 2,
          y: canvas.height * 0.4,
          size: 3 + Math.random() * 4,
          color: '#FFF',
          speedX: (Math.random() - 0.5) * 15,
          speedY: (Math.random() - 0.5) * 15,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 5,
          opacity: 1,
          decay: 0.015 + Math.random() * 0.015,
          gravity: 0.1,
        });
      }
    };

    initBursts();

    // Trigger secondary burst after 1.2 seconds only in full mode
    let timerId: number | undefined;
    if (variant === 'full') {
      timerId = window.setTimeout(() => {
        if (canvas) {
          for (let i = 0; i < 45; i++) {
            particles.push(createParticle(canvas.width * 0.25, canvas.height, -60, 30));
            particles.push(createParticle(canvas.width * 0.75, canvas.height, -120, 30));
          }
        }
      }, 1200);
    }

    // Animation Loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        // Apply physics
        p.speedY += p.gravity;
        p.speedX *= 0.98; // air resistance
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;
        p.opacity -= p.decay;

        if (p.opacity <= 0) {
          particles.splice(i, 1);
          continue;
        }

        // Draw particle
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        // Custom organic geometric shapes
        if (i % 3 === 0) {
          // Rectangle
          ctx.fillRect(-p.size / 2, -p.size, p.size, p.size * 1.5);
        } else if (i % 3 === 1) {
          // Triangle
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.lineTo(p.size, p.size);
          ctx.lineTo(-p.size, p.size);
          ctx.closePath();
          ctx.fill();
        } else {
          // Circle / Sparkle
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      if (particles.length > 0) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        // Complete when all particles finished fading
        if (onComplete) onComplete();
      }
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (timerId !== undefined) {
        clearTimeout(timerId);
      }
    };
  }, [active, onComplete, variant]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 w-full h-full pointer-events-none z-[100]"
        >
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block pointer-events-none" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
