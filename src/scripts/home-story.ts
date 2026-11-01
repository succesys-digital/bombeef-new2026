import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createBurger, type BurgerState } from './burger-gl';

gsap.registerPlugin(ScrollTrigger);

const story = document.querySelector<HTMLElement>('[data-story]');
const lite = (navigator as any).connection?.saveData || ((navigator as any).deviceMemory ?? 8) <= 2;

if (story && document.documentElement.classList.contains('motion')) init(story);

// Layout box from offset*: unaffected by scroll position (reload mid-page) or the entrance animation.
function restBox(img: HTMLImageElement) {
  const width = img.offsetWidth, height = img.offsetHeight;
  return { left: img.offsetLeft - width / 2, top: img.offsetTop - height / 2, width, height };
}

async function init(story: HTMLElement) {
  const stage = story.querySelector<HTMLElement>('.stage')!;
  const img = story.querySelector<HTMLImageElement>('[data-burger-img]')!;
  const canvas = story.querySelector<HTMLCanvasElement>('[data-burger-gl]')!;
  const state: BurgerState = { yaw: 0, pitch: 0, explode: 0, scale: 1, x: 0, y: 0, shadow: 0 };

  let gl: Awaited<ReturnType<typeof createBurger>> = null;

  const render = () => {
    if (gl) return gl.invalidate();
    // No WebGL: the photo stays, with honest perspective only.
    img.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.scale}) perspective(1200px) rotateY(${state.yaw * 14}deg)`;
  };

  buildTimeline(story, stage, state, render);
  bindInput(canvas, () => gl, state, render);

  if (lite) return;

  // Never blocks first paint: the <img> is the LCP element and stays until the scene is ready.
  const start = () => createBurger(canvas, {
    src: canvas.dataset.src!,
    depth: canvas.dataset.depth!,
    state,
    rest: () => restBox(img),
  }).then((scene) => {
    if (!scene) return;
    gl = scene;
    stage.classList.add('gl-ready');
    canvas.addEventListener('burger:lost', () => { gl = null; stage.classList.remove('gl-ready'); render(); }, { once: true });
    ScrollTrigger.addEventListener('refresh', () => scene.refresh());
    // A single turn on arrival shows the burger can be handled.
    gsap.fromTo(state, { yaw: state.yaw - 0.75, pitch: -0.25 }, { yaw: state.yaw, pitch: 0, duration: 1.5, ease: 'power3.out', onUpdate: render });
    if (matchMedia('(hover: none)').matches) swayLight(scene);
  }).catch((err) => console.warn('burger scene disabled', err));
  ('requestIdleCallback' in window ? requestIdleCallback : setTimeout)(start as any, { timeout: 900 } as any);
}

// Touch screens have no hover, so the light that follows the mouse on desktop drifts on its own.
// Runs only on the opening screen, to spare the battery once the visitor scrolls.
function swayLight(scene: NonNullable<Awaited<ReturnType<typeof createBurger>>>) {
  const sway = gsap.fromTo(scene.input, { hoverYaw: -0.16, hoverPitch: 0.12 }, { hoverYaw: 0.16, hoverPitch: -0.12, duration: 3.5, ease: 'sine.inOut', yoyo: true, repeat: -1, onUpdate: scene.invalidate });
  ScrollTrigger.create({ start: 0, end: () => innerHeight * 0.4, onToggle: (self) => { if (self.isActive) sway.play(); else sway.pause(); } });
}

function buildTimeline(story: HTMLElement, stage: HTMLElement, state: BurgerState, render: () => void) {
  const q = gsap.utils.selector(stage);
  const steps = q('[data-step]') as HTMLElement[];
  const wide = () => innerWidth >= 900;
  const box = () => restBox(q('[data-burger-img]')[0] as HTMLImageElement);
  // Y centre of each real layer on the photo, as a fraction of its height: bun, cheese, meat, salad.
  const focus = [0.2, 0.42, 0.6, 0.86];

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    onUpdate: render,
    scrollTrigger: { trigger: story, start: 'top top', end: 'bottom bottom', scrub: 0.5, invalidateOnRefresh: true },
  });

  // The promise acted out by the type itself: gourmet shrinks away, quality outgrows the screen.
  tl.to(q('.slogan__minus'), { scale: 0.18, autoAlpha: 0, transformOrigin: '0% 100%', duration: 0.9 }, 0)
    .to(q('.slogan__plus'), { scale: 3.4, autoAlpha: 0, transformOrigin: '50% 60%', duration: 1.2, ease: 'power1.in' }, 0)
    .to(q('.stage__intro'), { autoAlpha: 0, y: -24, duration: 0.45 }, 0)
    .to(state, { explode: 1, duration: 1, ease: 'power2.inOut' }, 0.5);

  steps.forEach((el, i) => {
    const at = 1.2 + i * 1.5;
    tl.to(state, {
      scale: () => (wide() ? 1.15 : 1.08),
      // Rest position is right of centre on desktop; pull the burger left of the caption.
      x: () => (wide() ? -innerWidth * 0.3 : 0),
      y: () => {
        const b = box();
        const toMiddle = innerHeight * (wide() ? 0.53 : 0.4) - (b.top + b.height / 2);
        return toMiddle + (0.5 - focus[i]) * b.height * (wide() ? 0.8 : 0.9);
      },
      yaw: i % 2 ? -0.28 : 0.28,
      duration: 0.9,
      ease: 'power2.inOut',
    }, at - 0.5)
      .fromTo(el, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.25 }, at)
      .to(el, { autoAlpha: 0, y: -28, duration: 0.25 }, at + 1.15);
  });

  const end = 1.2 + steps.length * 1.5;
  tl.to(state, { explode: 0, scale: () => (wide() ? 1.05 : 0.95), x: () => (wide() ? innerWidth * 0.1 : 0), y: () => { const b = box(); return (wide() ? innerHeight * 0.52 : innerHeight * 0.33) - (b.top + b.height / 2); }, yaw: 0, duration: 1, ease: 'power2.inOut' }, end - 0.2)
    .to(state, { shadow: 1, duration: 0.5 }, end)
    .to(stage, { backgroundColor: '#ea6323', duration: 0.6 }, end)
    .fromTo(q('.stage__outro'), { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.5 }, end + 0.4)
    .to({}, { duration: 0.8 });
}

function bindInput(canvas: HTMLCanvasElement, scene: () => any, state: BurgerState, render: () => void) {
  let lastX = 0, lastT = 0;
  const px = () => 1 / Math.max(canvas.clientWidth * 0.35, 220);

  canvas.addEventListener('pointerdown', (e) => {
    const s = scene();
    if (!s) return;
    s.input.dragging = true;
    s.input.vel = 0;
    lastX = e.clientX;
    lastT = e.timeStamp;
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('is-dragging');
  });
  canvas.addEventListener('pointermove', (e) => {
    const s = scene();
    if (!s) return;
    if (s.input.dragging) {
      const dx = (e.clientX - lastX) * px();
      s.input.yaw = Math.max(-0.9, Math.min(0.9, s.input.yaw + dx));
      s.input.vel = dx * Math.min(1, 16 / Math.max(1, e.timeStamp - lastT));
      lastX = e.clientX;
      lastT = e.timeStamp;
      s.invalidate();
    } else if (e.pointerType === 'mouse') {
      s.input.hoverYaw = ((e.clientX / innerWidth) - 0.5) * 0.3;
      s.input.hoverPitch = ((e.clientY / innerHeight) - 0.5) * -0.3;
      s.invalidate();
    }
  });
  const end = () => { const s = scene(); if (s) { s.input.dragging = false; s.invalidate(); } canvas.classList.remove('is-dragging'); };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  // Same control from the keyboard.
  canvas.addEventListener('keydown', (e) => {
    const dir = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
    if (!dir) return;
    e.preventDefault();
    const s = scene();
    if (s) { s.input.vel = dir * 0.035; s.invalidate(); } else { state.yaw = Math.max(-1, Math.min(1, state.yaw + dir * 0.2)); render(); }
  });
}

