// Anel que acompanha o mouse e cresce sobre o que é clicável.
// Só em telas com mouse e sem movimento reduzido; o cursor do sistema continua aparecendo.
if (matchMedia('(pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  ring.setAttribute('aria-hidden', 'true');
  document.body.append(ring);

  let x = innerWidth / 2;
  let y = innerHeight / 2;
  let rx = x;
  let ry = y;
  let scale = 1;
  let target = 1;
  let seen = false;

  addEventListener('pointermove', (e) => {
    x = e.clientX;
    y = e.clientY;
    if (!seen) {
      seen = true;
      rx = x;
      ry = y;
      ring.classList.add('is-on');
    }
    const el = e.target as HTMLElement;
    target = el.closest('a, button, [role="button"], label, summary') ? 2.1 : el.closest('[data-hero], .pit') ? 1.5 : 1;
  });
  document.addEventListener('pointerleave', () => ring.classList.remove('is-on'));
  document.addEventListener('pointerenter', () => seen && ring.classList.add('is-on'));
  addEventListener('pointerdown', () => (target *= 0.8));

  const loop = () => {
    rx += (x - rx) * 0.2;
    ry += (y - ry) * 0.2;
    scale += (target - scale) * 0.18;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(${scale})`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

export {};
