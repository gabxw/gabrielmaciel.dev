// Retrato em ASCII por cima da foto real. O mouse abre um círculo que revela a foto,
// com um anel de caracteres embaralhando na borda, como se a imagem estivesse sendo decifrada.
//
// Duas camadas, separadas por uma máscara da pessoa (src/assets/retrato-mascara.png):
// - a pessoa, com a rampa inteira, verde do escuro ao quase branco e contorno com traços direcionais;
// - a paisagem, bem fraca e rala, só para o quadro não ficar um vazio preto.

// Do mais vazio ao mais denso. Sem traços (-, =) no miolo, que viram listras horizontais.
const RAMP = ' .:;+*?%S#@';
const BG_RAMP = ' .::;;+*';
const SCRAMBLE = '01<>/\\{}[]#%@&$*+=-';
const BG = '#050a08';

// Verde do site (#4ade80) clareando até quase branco nos pontos mais claros da pessoa.
const DARK = [52, 190, 104];
const MID = [74, 222, 128];
const LIGHT = [220, 252, 231];

interface Cell {
  ch: string;
  color: string;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function green(l: number, alpha: number) {
  const [from, to, t] = l < 0.5 ? [DARK, MID, l / 0.5] : [MID, LIGHT, (l - 0.5) / 0.5];
  const c = from.map((v, i) => Math.round(v + (to[i] - v) * t));
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha.toFixed(2)})`;
}

function percentile(values: number[], p: number) {
  if (!values.length) return 0;
  const sorted = Float32Array.from(values).sort();
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
}

export function mountAsciiPortrait(root: HTMLElement) {
  const photo = root.querySelector<HTMLImageElement>('[data-ascii-photo]')!;
  const mascara = root.querySelector<HTMLImageElement>('[data-ascii-mascara]');
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
  let scanStart = 0;

  const random = (s: string) => s[Math.floor(Math.random() * s.length)];

  function readGrid(img: HTMLImageElement) {
    const probe = document.createElement('canvas');
    probe.width = cols;
    probe.height = rows;
    const pctx = probe.getContext('2d', { willReadFrequently: true })!;
    pctx.drawImage(img, 0, 0, cols, rows);
    return pctx.getImageData(0, 0, cols, rows).data;
  }

  function sample() {
    const rect = root.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    dpr = Math.min(devicePixelRatio, 2);
    canvas.width = base.width = Math.round(w * dpr);
    canvas.height = base.height = Math.round(h * dpr);

    // Cada célula tem proporção de um caractere monoespaçado.
    cols = Math.max(48, Math.round(w / 5));
    cellW = w / cols;
    cellH = cellW * 1.7;
    rows = Math.floor(h / cellH);

    const n = cols * rows;
    const pix = readGrid(photo);
    const maskPix = mascara ? readGrid(mascara) : null;

    const lum = new Float32Array(n);
    const mask = new Float32Array(n);
    const personLum: number[] = [];
    const bgLum: number[] = [];
    for (let i = 0; i < n; i++) {
      lum[i] = (0.2126 * pix[i * 4] + 0.7152 * pix[i * 4 + 1] + 0.0722 * pix[i * 4 + 2]) / 255;
      mask[i] = maskPix ? maskPix[i * 4] / 255 : 1;
      (mask[i] > 0.5 ? personLum : bgLum).push(lum[i]);
    }

    // Contraste esticado separado para a pessoa e para o fundo: cada um usa a própria distribuição.
    const pLo = percentile(personLum, 0.03);
    const pHi = percentile(personLum, 0.97);
    const bLo = percentile(bgLum, 0.08);
    const bHi = percentile(bgLum, 0.98);

    const m = (x: number, y: number) => mask[Math.min(rows - 1, Math.max(0, y)) * cols + Math.min(cols - 1, Math.max(0, x))];

    cells = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        const mi = mask[i];

        // Contorno: onde a máscara muda, um traço na direção da borda.
        const gx = m(x + 1, y) - m(x - 1, y);
        const gy = m(x, y + 1) - m(x, y - 1);
        const mag = Math.hypot(gx, gy);
        if (mi > 0.3 && mi < 0.85 && mag > 0.5) {
          const angle = Math.atan2(gy, gx);
          const a = Math.abs(Math.cos(angle));
          const b = Math.abs(Math.sin(angle));
          let ch = '|';
          if (b > a * 2.2) ch = '_';
          else if (a < b * 2.2) ch = gx * gy > 0 ? '/' : '\\';
          cells.push({ ch, color: green(0.75, 0.8) });
          continue;
        }

        if (mi > 0.5) {
          let l = clamp01((lum[i] - pLo) / Math.max(pHi - pLo, 0.01));
          // Curva que abre os tons escuros: rosto e cabelo ganham caracteres legíveis.
          l = Math.pow(l, 0.6);
          // Nem o cabelo escuro some: a pessoa nunca vira espaço vazio.
          const idx = Math.max(3, Math.min(RAMP.length - 1, Math.floor(l * RAMP.length)));
          cells.push({ ch: RAMP[idx], color: green(l, 0.72 + l * 0.28) });
          continue;
        }

        // Fundo: a paisagem rala e apagada, sumindo nas bordas do quadro.
        // Um respiro vazio em volta da pessoa separa a silhueta do cenário.
        let near = false;
        for (let dy = -1; dy <= 1 && !near; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            if (m(x + dx, y + dy) > 0.5) {
              near = true;
              break;
            }
          }
        }
        if (near) {
          cells.push({ ch: ' ', color: '' });
          continue;
        }
        const nx = (x + 0.5) / cols - 0.5;
        const ny = (y + 0.5) / rows - 0.5;
        const vignette = 1 - smooth(0.22, 0.68, Math.hypot(nx * 1.15, ny));
        const l = clamp01((lum[i] - bLo) / Math.max(bHi - bLo, 0.01)) * vignette;
        const ch = BG_RAMP[Math.min(BG_RAMP.length - 1, Math.floor(l * BG_RAMP.length))];
        cells.push({ ch, color: `rgba(74, 222, 128, ${(0.1 + l * 0.3).toFixed(2)})` });
      }
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
        baseCtx.fillStyle = cell.color;
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

  // Uma faixa clara desce devagar pelo retrato, como a varredura de um monitor antigo:
  // a própria camada de caracteres é somada a si mesma dentro da faixa.
  function drawScan(now: number) {
    const period = 5200;
    if (!scanStart) scanStart = now;
    const t = ((now - scanStart) % period) / period;
    const band = h * 0.16;
    const center = -band + t * (h + band * 2);
    const top = Math.max(0, center - band);
    const bottom = Math.min(h, center + band);
    if (bottom <= top) return;

    const steps = 8;
    const slice = (bottom - top) / steps;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'lighter';
    for (let s = 0; s < steps; s++) {
      const y = top + s * slice;
      const mid = y + slice / 2;
      ctx.globalAlpha = 0.55 * (1 - Math.abs(mid - center) / band);
      const sy = Math.round(y * dpr);
      const sh = Math.max(1, Math.round(slice * dpr));
      ctx.drawImage(base, 0, sy, canvas.width, sh, 0, sy, canvas.width, sh);
    }
    ctx.restore();
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

    if (introProgress >= 1 && !reduced) {
      drawScan(now);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Algumas células da pessoa piscam de vez em quando, para o retrato parecer vivo.
      if (now - lastFlicker > 70) {
        lastFlicker = now;
        for (let i = 0; i < 8; i++) {
          const x = Math.floor(Math.random() * cols);
          const y = Math.floor(Math.random() * rows);
          const cell = cells[y * cols + x];
          if (cell.ch !== ' ') drawCell(x, y, random(SCRAMBLE), cell.color);
        }
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

  const imgs = mascara ? [photo, mascara] : [photo];
  const ready = Promise.all(imgs.map((img) => (img.decode ? img.decode() : Promise.resolve())));
  Promise.all([ready, document.fonts.load('600 12px "Martian Mono"').catch(() => {})]).then(() => {
    sample();
    root.classList.add('is-live');
    if (!finePointer) root.classList.add('is-touch');
    // Sem a seção na tela, o primeiro quadro só pinta o fundo; a entrada começa quando ela aparecer.
    start();
  });
}
