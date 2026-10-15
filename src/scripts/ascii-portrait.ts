// Retrato em ASCII por cima da foto real. O mouse abre um círculo que revela a foto,
// com um anel de caracteres embaralhando na borda, como se a imagem estivesse sendo decifrada.
// Do mais vazio ao mais denso. Sem traços (-, =), que viram listras horizontais.
const RAMP = ' .:;+*?%S#@';
const SCRAMBLE = '01<>/\\{}[]#%@&$*+=-';
const BG = '#050a08';

interface Cell {
  ch: string;
  alpha: number;
}

export function mountAsciiPortrait(root: HTMLElement) {
  const photo = root.querySelector<HTMLImageElement>('[data-ascii-photo]')!;
  const canvas = root.querySelector<HTMLCanvasElement>('[data-ascii-canvas]')!;
  const ctx = canvas.getContext('2d')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;

  const base = document.createElement('canvas');
  const baseCtx = base.getContext('2d')!;

  let w = 0;
  let h = 0;
  let dpr = 1;
  let cols = 0;
  let rows = 0;
  let cellW = 0;
  let cellH = 0;
  let cells: Cell[] = [];

  // Revelação
  const pointer = { x: 0, y: 0 };
  let radius = 0;
  let targetRadius = 0;
  let touchOpen = false;

  // Entrada linha por linha
  let introProgress = reduced ? 1 : 0;
  let introStarted = reduced;

  let visible = false;
  let running = false;
  let lastFlicker = 0;

  const random = (s: string) => s[Math.floor(Math.random() * s.length)];

  function sample() {
    const rect = root.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    dpr = Math.min(devicePixelRatio, 2);
    canvas.width = base.width = Math.round(w * dpr);
    canvas.height = base.height = Math.round(h * dpr);

    // Cada célula tem proporção de um caractere monoespaçado.
    cols = Math.max(40, Math.round(w / 5.6));
    cellW = w / cols;
    cellH = cellW * 1.7;
    rows = Math.floor(h / cellH);

    // A foto reduzida ao tamanho da grade dá o brilho de cada célula.
    const probe = document.createElement('canvas');
    probe.width = cols;
    probe.height = rows;
    const pctx = probe.getContext('2d', { willReadFrequently: true })!;
    pctx.drawImage(photo, 0, 0, cols, rows);
    const data = pctx.getImageData(0, 0, cols, rows).data;

    // Estica o contraste pela distribuição de brilho da própria foto: o que é escuro
    // vira espaço e o rosto ganha os caracteres mais densos.
    const lum = new Float32Array(cols * rows);
    for (let i = 0; i < lum.length; i++) {
      lum[i] = (0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255;
    }
    const sorted = Float32Array.from(lum).sort();
    const lo = sorted[Math.floor(sorted.length * 0.42)];
    const hi = sorted[Math.floor(sorted.length * 0.985)];

    cells = [];
    for (let i = 0; i < lum.length; i++) {
      let l = Math.min(1, Math.max(0, (lum[i] - lo) / Math.max(hi - lo, 0.01)));
      l = Math.pow(l, 0.8);
      const ch = RAMP[Math.min(RAMP.length - 1, Math.floor(l * RAMP.length))];
      cells.push({ ch, alpha: 0.4 + l * 0.6 });
    }

    drawBase();
  }

  function setFont(c: CanvasRenderingContext2D) {
    c.font = `600 ${(cellH * 0.92).toFixed(2)}px "Martian Mono", ui-monospace, monospace`;
    c.textBaseline = 'top';
    c.textAlign = 'center';
  }

  function drawBase() {
    baseCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    baseCtx.fillStyle = BG;
    baseCtx.fillRect(0, 0, w, h);
    setFont(baseCtx);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cell = cells[y * cols + x];
        if (cell.ch === ' ') continue;
        baseCtx.fillStyle = `rgba(74, 222, 128, ${cell.alpha.toFixed(2)})`;
        baseCtx.fillText(cell.ch, x * cellW + cellW / 2, y * cellH);
      }
    }
  }

  function drawCell(x: number, y: number, ch: string, color: string) {
    ctx.fillStyle = BG;
    ctx.fillRect(x * cellW, y * cellH, cellW + 0.5, cellH + 0.5);
    ctx.fillStyle = color;
    ctx.fillText(ch, x * cellW + cellW / 2, y * cellH);
  }

  function frame(now: number) {
    if (!running) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // O fundo escuro cobre a foto; o ASCII e o círculo de revelação vêm por cima.
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Entrada: só as linhas já "digitadas" aparecem.
    const shownRows = Math.floor(introProgress * rows);
    if (shownRows > 0) {
      ctx.drawImage(base, 0, 0, canvas.width, Math.round(shownRows * cellH * dpr), 0, 0, canvas.width, Math.round(shownRows * cellH * dpr));
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    setFont(ctx);

    if (!introStarted) {
      running = false;
      return;
    }

    if (introProgress < 1) {
      // A linha que está sendo digitada embaralha antes de assentar.
      const y = Math.min(rows - 1, shownRows);
      ctx.fillStyle = BG;
      ctx.fillRect(0, y * cellH, w, h - y * cellH);
      for (let x = 0; x < cols; x++) {
        if (Math.random() < 0.55) drawCell(x, y, random(SCRAMBLE), 'rgba(187, 247, 208, 0.9)');
      }
      introProgress = Math.min(1, introProgress + 1 / 70);
    }

    // Algumas células piscam de vez em quando, para o retrato parecer vivo.
    if (introProgress >= 1 && !reduced && now - lastFlicker > 70) {
      lastFlicker = now;
      for (let i = 0; i < 6; i++) {
        const x = Math.floor(Math.random() * cols);
        const y = Math.floor(Math.random() * rows);
        if (cells[y * cols + x].ch !== ' ') drawCell(x, y, random(SCRAMBLE), 'rgba(74, 222, 128, 0.85)');
      }
    }

    radius += (targetRadius - radius) * (reduced ? 1 : 0.14);

    if (radius > 1) {
      // Anel de caracteres embaralhando em volta do círculo.
      if (!reduced) {
        const inner = radius * 0.82;
        const outer = radius * 1.28;
        const x0 = Math.max(0, Math.floor((pointer.x - outer) / cellW));
        const x1 = Math.min(cols - 1, Math.ceil((pointer.x + outer) / cellW));
        const y0 = Math.max(0, Math.floor((pointer.y - outer) / cellH));
        const y1 = Math.min(rows - 1, Math.ceil((pointer.y + outer) / cellH));
        for (let y = y0; y <= y1; y++) {
          for (let x = x0; x <= x1; x++) {
            const d = Math.hypot(x * cellW + cellW / 2 - pointer.x, y * cellH + cellH / 2 - pointer.y);
            if (d > inner && d < outer && Math.random() < 0.7) {
              const heat = 1 - (d - inner) / (outer - inner);
              drawCell(x, y, random(SCRAMBLE), `rgba(187, 247, 208, ${(0.35 + heat * 0.65).toFixed(2)})`);
            }
          }
        }
      }

      // O círculo apaga o ASCII e deixa a foto de baixo aparecer.
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      const g = ctx.createRadialGradient(pointer.x, pointer.y, radius * 0.55, pointer.x, pointer.y, radius);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const idle = introProgress >= 1 && Math.abs(targetRadius - radius) < 0.5 && (reduced || !visible);
    if (idle) {
      running = false;
      return;
    }
    requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    requestAnimationFrame(frame);
  }

  function setPointer(e: PointerEvent) {
    const r = root.getBoundingClientRect();
    pointer.x = e.clientX - r.left;
    pointer.y = e.clientY - r.top;
  }

  const openRadius = () => Math.max(70, w * 0.24);

  root.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse') return;
    setPointer(e);
    targetRadius = openRadius();
    start();
  });
  root.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    setPointer(e);
    start();
  });
  root.addEventListener('pointerleave', (e) => {
    if (e.pointerType !== 'mouse') return;
    targetRadius = 0;
    start();
  });
  root.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') {
      targetRadius = openRadius() * 1.5;
      start();
      return;
    }
    // Toque: abre e fecha a foto inteira a partir do ponto tocado.
    setPointer(e);
    touchOpen = !touchOpen;
    targetRadius = touchOpen ? Math.hypot(w, h) * 1.1 : 0;
    root.classList.toggle('is-open', touchOpen);
    start();
  });
  root.addEventListener('pointerup', (e) => {
    if (e.pointerType === 'mouse') {
      targetRadius = openRadius();
      start();
    }
  });

  // Teclado: o foco revela a foto inteira, para quem navega sem mouse.
  root.addEventListener('focus', () => {
    pointer.x = w / 2;
    pointer.y = h / 2;
    targetRadius = Math.hypot(w, h);
    start();
  });
  root.addEventListener('blur', () => {
    targetRadius = 0;
    start();
  });

  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !introStarted) introStarted = true;
      if (visible) start();
    },
    { threshold: 0.25 },
  ).observe(root);

  let resizeTimer = 0;
  new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      sample();
      start();
    }, 120);
  }).observe(root);

  const ready = photo.decode ? photo.decode() : Promise.resolve();
  Promise.all([ready, document.fonts.load('600 12px "Martian Mono"').catch(() => {})]).then(() => {
    sample();
    root.classList.add('is-live');
    if (!finePointer) root.classList.add('is-touch');
    // Sem a seção na tela, o primeiro quadro só pinta o fundo; a entrada começa quando ela aparecer.
    start();
  });
}
