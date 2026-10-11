import React, { useRef } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  type Variants,
} from 'framer-motion';

/** Premium spring: weighty, no linear easing. */
export const SPRING = { type: 'spring', stiffness: 100, damping: 20 } as const;

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/* -----------------------------------------------------------------
 * Stagger container + child variants.
 * Parent and children must live in the same component tree.
 * ----------------------------------------------------------------- */
export const staggerContainer = (stagger = 0.08, delay = 0): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren: stagger, delayChildren: delay },
  },
});

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 26, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.7, ease: EASE_OUT },
  },
};

/* -----------------------------------------------------------------
 * Reveal - scroll-entry fade-up with optional blur, once per mount.
 * ----------------------------------------------------------------- */
export const Reveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'article';
}> = ({ children, delay = 0, y = 26, className }) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.75, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
};

/* -----------------------------------------------------------------
 * TiltCard - 3D parallax tilt tracking the pointer.
 * Uses MotionValues outside the render cycle (no useState re-renders).
 * Children get a subtle translateZ lift via CSS .lift-1 / .lift-2.
 * ----------------------------------------------------------------- */
export const TiltCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  /** Max tilt in degrees. 8-12 reads premium; higher feels toylike. */
  max?: number;
  scale?: number;
}> = ({ children, className = '', max = 9, scale = 1.015 }) => {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);

  const rotateXRaw = useTransform(py, [0, 1], [max, -max]);
  const rotateYRaw = useTransform(px, [0, 1], [-max, max]);
  const rotateX = useSpring(rotateXRaw, SPRING);
  const rotateY = useSpring(rotateYRaw, SPRING);
  const glareX = useTransform(px, [0, 1], ['20%', '80%']);
  const glareY = useTransform(py, [0, 1], ['20%', '80%']);
  const glareOpacity = useTransform(px, [0, 0.5, 1], [0.04, 0.1, 0.04]);
  const glareBackground = useTransform(
    [glareX, glareY] as [typeof glareX, typeof glareY],
    ([x, y]: string[]) =>
      `radial-gradient(420px circle at ${x} ${y}, rgb(255 255 255 / 0.5), transparent 62%)`
  );
  const scaleV = useSpring(useTransform(px, [0, 1], [1, scale]), SPRING);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };

  const onLeave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  if (reduce) {
    return (
      <div className={className} ref={ref}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        rotateX,
        rotateY,
        scale: scaleV,
        transformPerspective: 1200,
        transformStyle: 'preserve-3d',
      }}
      className={`relative will-change-transform ${className}`}
    >
      {children}
      {/* Cursor-following glare: inner light, not a neon glow */}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{
          background: glareBackground,
          opacity: glareOpacity,
          mixBlendMode: 'overlay',
        }}
      />
    </motion.div>
  );
};

/* -----------------------------------------------------------------
 * MagneticButton - pulls toward the cursor via MotionValues.
 * Never uses useState for the hover physics.
 * ----------------------------------------------------------------- */
export const MagneticButton: React.FC<{
  children: React.ReactNode;
  className?: string;
  strength?: number;
  onClick?: () => void;
  href?: string;
  ariaLabel?: string;
}> = ({ children, className = '', strength = 0.35, onClick, href, ariaLabel }) => {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 150, damping: 14, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 150, damping: 14, mass: 0.4 });

  const onMove = (e: React.MouseEvent) => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };

  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  const inner = (
    <motion.span
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: sx, y: sy }}
      className={`inline-flex will-change-transform ${className}`}
      onClick={onClick}
      role={href ? undefined : 'button'}
      tabIndex={href ? undefined : 0}
      onKeyDown={
        href
          ? undefined
          : (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
      }
      aria-label={ariaLabel}
    >
      {children}
    </motion.span>
  );

  if (href) {
    return (
      <a href={href} className="inline-block" aria-label={ariaLabel}>
        {inner}
      </a>
    );
  }
  return inner;
};

/* -----------------------------------------------------------------
 * KineticHeading - words rise in sequence on mount/scroll.
 * ----------------------------------------------------------------- */
export const KineticHeading: React.FC<{
  text: string;
  className?: string;
  /** Heading level; defaults to h2 */
  level?: 1 | 2 | 3;
  /** word indices rendered in the accent color */
  accentWords?: number[];
  delay?: number;
}> = ({ text, className = '', level = 2, accentWords = [], delay = 0 }) => {
  const reduce = useReducedMotion();
  const words = text.split(' ');

  const Tag = (level === 1
    ? motion.h1
    : level === 3
    ? motion.h3
    : motion.h2) as typeof motion.h2;

  return (
    <Tag
      className={className}
      initial={reduce ? false : 'hidden'}
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.06, delayChildren: delay } },
      }}
    >
      {words.map((w, i) => (
        <span key={`${w}-${i}`} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className={`inline-block ${
              accentWords.includes(i) ? 'text-accent' : ''
            }`}
            variants={{
              hidden: { y: '110%', opacity: 0 },
              show: {
                y: '0%',
                opacity: 1,
                transition: { duration: 0.7, ease: EASE_OUT },
              },
            }}
          >
            {w}
            {i < words.length - 1 ? '\u00A0' : ''}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
};
