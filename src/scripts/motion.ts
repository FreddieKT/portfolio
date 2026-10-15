// GSAP for interaction-only layout motion (docs/MOTION.md rule 7). Never import this into a
// load-time animation: content must render in its final state on the first frame.
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(Flip, CustomEase);

const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// Same curve as --motion-ease, so Flip and CSS transitions feel like one system.
const [x1, y1, x2, y2] = token('--motion-ease').match(/[\d.]+/g)?.map(Number) ?? [0.2, 0, 0, 1];
const curve = CustomEase.create('motion', `M0,0 C${x1},${y1} ${x2},${y2} 1,1`);

export const prefersReducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// CSS time token in seconds. The minifier rewrites millisecond values into seconds, so honour the unit.
const seconds = (value: string) => parseFloat(value) / (value.endsWith('ms') ? 1000 : 1) || 0;

/** Duration (from --motion-slow, 0 under reduced motion) and easing for Flip layout tweens. */
export const layoutTween = () => ({ duration: seconds(token('--motion-slow')), ease: curve });

export { Flip };
