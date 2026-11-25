// claquete studio: partes interativas da página (mini estúdio, "monte o seu" e mesa de sons).
// Os dados vêm de dados.js (window.ESTUDIO), gerado do projeto do estúdio.
(() => {
  const E = window.ESTUDIO;
  if (!E) return;
  const D = E.duracao;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduzir = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad2 = (n) => String(n).padStart(2, '0');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const suave = (x) => x * x * (3 - 2 * x);
  const sorte = (a, b) => a + Math.random() * (b - a);
  const tempo = (s) => {
    const t = Math.floor(s);
    return `00:${pad2(Math.floor(t / 60))}:${pad2(t % 60)}:${pad2(Math.floor((s - t) * 60))}`;
  };
  const AGENTES = [
    ['roteiro', '#f472b6'], ['cena', '#fb923c'], ['personagem', '#facc15'], ['texto', '#a3e635'],
    ['interface', '#34d399'], ['som', '#22d3ee'], ['voz', '#60a5fa'], ['movimento', '#818cf8'],
    ['cor', '#c084fc'], ['revisao', '#f87171'], ['timeline', '#fdba74'], ['render', '#94a3b8'],
  ];

  // ---------------- áudio (Web Audio, os mesmos WAVs do estúdio) ----------------
  const buffers = {};
  const carregando = {};
  // decodifica sem AudioContext "vivo" (OfflineAudioContext não precisa de gesto do usuário)
  let decodificador;
  const carregar = (nomes) => Promise.all(nomes.map((n) => {
    if (carregando[n]) return carregando[n];
    decodificador ??= new OfflineAudioContext(1, 1, 44100);
    carregando[n] = fetch(`sons/${n}.wav`)
      .then((r) => r.arrayBuffer())
      .then((b) => decodificador.decodeAudioData(b))
      .then((buf) => { buffers[n] = buf; return buf; })
      .catch((e) => { delete carregando[n]; console.warn('[estudio] som não carregou:', n, e); });
    return carregando[n];
  }));

  let ctx = null;
  let mestre = null;
  let somLigado = true;
  const audio = () => {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      mestre = ctx.createGain();
      mestre.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    mestre.gain.value = somLigado ? 1 : 0;
    return ctx;
  };
  const tocar = (nome, { em = 0, ganho = 1, taxa = 1 } = {}) => {
    const b = buffers[nome];
    if (!b || !ctx) return null;
    const s = ctx.createBufferSource();
    s.buffer = b;
    s.playbackRate.value = taxa;
    const g = ctx.createGain();
    g.gain.value = ganho;
    s.connect(g).connect(mestre);
    s.start(Math.max(ctx.currentTime, em));
    return s;
  };

  // ---------------- textos do vídeo atual ----------------
  $$('[data-app]').forEach((el) => { el.textContent = E.app; });
  $$('[data-dur]').forEach((el) => { el.textContent = String(Math.round(D)); });

  // só um vídeo toca por vez
  // vídeo de venda: botão grande de play sobre a capa, some quando o vídeo começa
  const vendaVideo = document.getElementById('video-venda');
  const vendaPlay = document.getElementById('venda-play');
  if (vendaVideo && vendaPlay) {
    vendaPlay.addEventListener('click', () => {
      vendaVideo.play();
      vendaVideo.focus();
    });
    vendaVideo.addEventListener('play', () => vendaPlay.parentElement.classList.add('tocou'));
  }
  const videos = $$('video');
  videos.forEach((v) => v.addEventListener('play', () => videos.forEach((o) => { if (o !== v && !o.paused) o.pause(); })));

  // ---------------- narração (transcrição) ----------------
  const narr = $('#narracao');
  if (narr) E.cenas.forEach((c) => {
    const li = document.createElement('li');
    li.textContent = c.fala;
    narr.append(li);
  });

  // ================= mini estúdio =================
  const mini = $('#mini');
  if (mini) {
    const video = $('#mini-video');
    const faixas = $('#tl-faixas');
    const faixa = (id) => $(`[data-faixa=${id}]`, mini);
    const btnMontar = $('#montar');
    const btnPlay = $('#tl-play');
    const btnLegenda = $('#tl-legenda');
    const btnSom = $('#tl-som');
    const btnRemontar = $('#tl-remontar');
    const elTempo = $('#tl-tempo');
    const elEstado = $('#tl-estado');
    const elAtivos = $('#mini-ativos');
    const elQuadros = $('#mini-quadros');
    const registro = $('#registro');
    const logConta = $('#log-conta');
    const QUADROS = Math.round(D * (E.fps || 60));
    $('#mini-nome').textContent = `${E.slug}_v1`;
    $('#mini-info').textContent = `${E.cenas.length} cenas · 1080p · ${E.fps || 60} fps`;
    $('#tl-total').textContent = tempo(D);
    $('#mini-quadros').textContent = `0/${QUADROS} quadros`;
    faixas.setAttribute('aria-valuemax', String(Math.floor(D)));
    const regua = $('#regua');
    for (let s = 0; s < D - 1; s += 5) {
      const m = document.createElement('span');
      m.style.left = (s / D) * 100 + '%';
      m.textContent = s + 's';
      regua.append(m);
    }
    const fim = $('#mini-fim');
    const outro = $('#video-vertical');
    const SONS_MINI = ['tecla1', 'tecla2', 'tecla3', 'tecla4', 'espaco', 'pop', 'sino'];

    // --- clipes da timeline, nas posições reais das cenas ---
    const clipes = [];
    const novoClipe = (fid, texto, c, i) => {
      const el = document.createElement('span');
      el.className = 'clip oculto';
      el.style.left = (c.de / D) * 100 + '%';
      el.style.width = `calc(${((c.ate - c.de) / D) * 100}% - 3px)`;
      el.textContent = texto;
      faixa(fid).append(el);
      clipes.push({ el, f: c.de / D, i, fid, rotulo: texto });
      return el;
    };
    E.cenas.forEach((c, i) => {
      novoClipe('cenas', `${pad2(i + 1)} · ${c.nome}`, c, i).dataset.cena = i;
      if (c.personagem) novoClipe('pers', c.personagem, c, i);
      if (c.texto) novoClipe('texto', c.texto, c, i);
      [{ em: 0.05 }, ...c.efeitos].forEach((e, k) => {
        const p = document.createElement('i');
        p.className = 'ponto oculto';
        p.style.left = ((c.de + e.em) / D) * 100 + '%';
        p.style.setProperty('--c', AGENTES[(i * 3 + k) % 12][1]);
        p.style.setProperty('--k', k % 3);
        faixa('efeitos').append(p);
        clipes.push({ el: p, f: (c.de + e.em) / D, i, fid: 'efeitos', ponto: true });
      });
    });
    const cenaClipes = $$('[data-faixa=cenas] .clip', mini);

    // --- onda da voz (picos reais da narração) ---
    const n = E.picos.length;
    const barras = E.picos.map((v, i) => {
      const h = Math.max(1.6, v * 17);
      return `<rect x="${((i * 100) / n).toFixed(3)}" y="${(10 - h / 2).toFixed(2)}" width="${((100 / n) * 0.55).toFixed(3)}" height="${h.toFixed(2)}" rx=".25"/>`;
    }).join('');
    const pos = `left:${(E.vozInicio / D) * 100}%;width:${(E.vozDuracao / D) * 100}%`;
    faixa('voz').innerHTML = `<svg class="onda base" style="${pos}" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">${barras}</svg>` +
      `<svg class="onda tocada" style="${pos}" viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden="true">${barras}</svg>`;
    const vozFrac = (p) => clamp((p * D - E.vozInicio) / E.vozDuracao);

    // --- ponteiros dos 12 agentes ---
    const cursores = AGENTES.map(([nome, cor]) => {
      const el = document.createElement('div');
      el.className = 'cursor';
      el.setAttribute('aria-hidden', 'true');
      el.style.setProperty('--c', cor);
      el.innerHTML = `<svg width="18" height="20" viewBox="0 0 18 20"><path d="M2 1.5 15.5 9 9.6 10.4 6.9 16.8z" fill="${cor}" stroke="#0b0c0e" stroke-width="1.3" stroke-linejoin="round"/></svg><span>${nome}</span>`;
      mini.append(el);
      return el;
    });

    // --- estado ---
    let estado = 'vazio';
    let raf = 0;
    let cenaAtual = -1;
    let timers = [];
    let acoes = 0;
    const setEstado = (e) => { estado = e; mini.dataset.estado = e; };
    const setP = (p) => {
      faixas.style.setProperty('--p', p);
      faixas.style.setProperty('--pv', vozFrac(p));
    };

    const registrar = (cor, tag, texto) => {
      if (registro.firstElementChild?.classList.contains('apagado')) registro.innerHTML = '';
      const li = document.createElement('li');
      li.style.setProperty('--c', cor);
      li.innerHTML = '<b></b><span></span><em>ok</em>';
      li.children[0].textContent = tag;
      li.children[1].textContent = texto;
      registro.prepend(li);
      while (registro.children.length > 7) registro.lastElementChild.remove();
      logConta.textContent = `${++acoes} ações`;
    };

    const camadas = $$('#camadas dd');
    const mostrarCena = (i) => {
      if (i === cenaAtual) return;
      cenaClipes[cenaAtual]?.classList.remove('atual');
      cenaAtual = i;
      if (i < 0) return;
      const c = E.cenas[i];
      cenaClipes[i].classList.add('atual');
      $('#lado-titulo').textContent = `camadas · cena ${pad2(i + 1)}`;
      $('#lado-arquivo').textContent = c.arquivo;
      const v = [c.fundo, c.personagem || '—', c.texto ? `"${c.texto}"` : '—', c.movimento || '—', c.efeitos.length ? c.efeitos.map((e) => e.som).join(', ') : 'entrada'];
      camadas.forEach((dd, k) => { dd.textContent = v[k]; });
    };
    const cenaEm = (t) => {
      for (let i = E.cenas.length - 1; i >= 0; i--) if (t >= E.cenas[i].de - 0.01) return i;
      return 0;
    };

    // --- reprodução ---
    let ultimoSeg = -1;
    const quadro = () => {
      const t = video.currentTime;
      setP(t / D);
      elTempo.textContent = tempo(t);
      mostrarCena(cenaEm(t));
      const s = Math.floor(t);
      if (s !== ultimoSeg) {
        ultimoSeg = s;
        faixas.setAttribute('aria-valuenow', String(s));
        faixas.setAttribute('aria-valuetext', `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}, cena ${cenaAtual + 1} de ${E.cenas.length}: ${E.cenas[cenaAtual].nome}`);
      }
    };
    const laco = () => { quadro(); if (!video.paused) raf = requestAnimationFrame(laco); };
    video.addEventListener('play', () => {
      if (estado !== 'pronto') return; // o play que destrava o som durante a montagem não conta
      mini.classList.add('tocando');
      elEstado.textContent = 'tocando · 1x';
      btnPlay.setAttribute('aria-label', 'Pausar o vídeo');
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(laco);
    });
    video.addEventListener('pause', () => {
      if (estado !== 'pronto') return;
      mini.classList.remove('tocando');
      if (estado === 'pronto') elEstado.textContent = video.ended ? 'fim' : 'pausado';
      btnPlay.setAttribute('aria-label', 'Tocar o vídeo');
      quadro();
    });
    video.addEventListener('seeked', () => { if (estado === 'pronto') quadro(); });
    // no fim do vídeo, o momento de maior atenção: chamada para o kit
    video.addEventListener('ended', () => {
      if (estado !== 'pronto') return;
      fim.hidden = false;
      $('a', fim).focus({ preventScroll: true });
    });
    video.addEventListener('play', () => { fim.hidden = true; if (estado === 'pronto' && outro && !outro.paused) outro.pause(); });
    if (outro) outro.addEventListener('play', () => { if (!video.paused) video.pause(); });
    $('#fim-denovo').addEventListener('click', () => {
      fim.hidden = true;
      video.currentTime = 0;
      video.play();
      btnPlay.focus({ preventScroll: true });
    });

    // destrava o vídeo com som dentro do gesto do usuário (Safari exige), para tocar no fim da montagem
    let destravado = false;
    const destravar = () => {
      if (destravado) return;
      destravado = true;
      const vol = video.volume;
      video.muted = false;
      video.volume = 0;
      video.play().then(() => {
        if (estado !== 'pronto') video.pause();
        video.volume = vol;
      }).catch(() => { video.volume = vol; destravado = false; });
    };

    // --- teclado mecânico: palavras com pausas, como no estúdio ---
    const agendaTeclas = (t0, ate) => {
      let t = t0 + 0.15;
      while (t < ate) {
        const letras = Math.floor(sorte(3, 8));
        for (let k = 0; k < letras && t < ate; k++) {
          tocar(`tecla${1 + Math.floor(Math.random() * 4)}`, { em: t, ganho: sorte(0.12, 0.17), taxa: sorte(0.96, 1.04) });
          t += sorte(0.062, 0.105);
        }
        tocar('espaco', { em: t, ganho: 0.14, taxa: sorte(0.97, 1.03) });
        t += Math.random() < 0.3 ? sorte(0.17, 0.3) : sorte(0.08, 0.12);
      }
    };

    const limpar = () => {
      timers.forEach(clearTimeout);
      timers = [];
      cursores.forEach((c) => c.getAnimations().forEach((a) => a.cancel()));
      clipes.forEach((c) => { c.el.getAnimations().forEach((a) => a.cancel()); c.el.classList.add('oculto'); });
      mostrarCena(-1);
      registro.innerHTML = '<li class="apagado">agentes montando…</li>';
      acoes = 0;
      logConta.textContent = '0 ações';
    };

    const INI = 150;
    const VARRE = 3600;
    const FIM = INI + VARRE;
    const VOLTA = 520;

    const terminar = () => {
      clipes.forEach((c) => { c.el.getAnimations().forEach((a) => a.cancel()); c.el.classList.remove('oculto'); });
      faixas.style.setProperty('--rev', 1);
      setEstado('pronto');
      elAtivos.textContent = 'revisão ok';
      btnRemontar.hidden = false;
      video.currentTime = 0;
      setP(0);
      mostrarCena(0);
      video.play().catch(() => {
        // navegador bloqueou o som: deixa o play nas mãos da pessoa
        elEstado.textContent = 'aperte o play';
        btnPlay.focus({ preventScroll: true });
      });
    };

    let rafMontagem = 0;
    const montar = async () => {
      if (estado === 'montando') return;
      audio();
      if (document.activeElement === btnMontar) btnPlay.focus({ preventScroll: true });
      video.preload = 'auto';
      setEstado('montando');
      mini.classList.remove('tocando');
      destravar();
      video.pause();
      cancelAnimationFrame(raf);
      cancelAnimationFrame(rafMontagem);
      limpar();
      fim.hidden = true;
      if (outro && !outro.paused) outro.pause();
      setEstado('montando');
      elEstado.textContent = '12 agentes · armando';
      elAtivos.textContent = '12 agentes ativos';
      btnRemontar.hidden = true;
      faixas.style.setProperty('--rev', 0);
      setP(0);

      if (reduzir) {
        faixas.style.setProperty('--rev', 1);
        E.cenas.forEach((c, i) => registrar(AGENTES[i % 12][1], `cena-${pad2(i + 1)}`, `${c.layout} · ${c.nome}`));
        tocar('sino', { ganho: 0.5 });
        terminar();
        return;
      }

      const m = mini.getBoundingClientRect();
      const alvo = (c) => {
        const r = c.el.getBoundingClientRect();
        return { x: r.left - m.left + Math.min(r.width / 2, 24), y: r.top - m.top + r.height / 2 };
      };
      const visiveis = clipes.filter((c) => c.el.offsetParent !== null);
      const ordem = visiveis.map((c) => ({ ...c, t: INI + 120 + c.f * (VARRE - 320) + sorte(0, 140) })).sort((a, b) => a.t - b.t);
      const rotas = AGENTES.map(() => []);
      ordem.forEach((c, k) => rotas[k % 12].push(c));

      const TOTAL = FIM + 420;
      const tr = (p) => `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
      cursores.forEach((cur, a) => {
        let p0 = { x: m.width * ((a % 4) + sorte(0.2, 0.8)) / 4, y: m.height * (Math.floor(a / 4) + sorte(0.2, 0.8)) / 3 };
        const kf = [{ offset: 0, transform: tr(p0), opacity: 0 }, { offset: 140 / TOTAL, transform: tr(p0), opacity: 1 }];
        let tAnt = 140;
        for (const c of rotas[a]) {
          const p = alvo(c);
          let sai = c.t - sorte(240, 420);
          if (sai <= tAnt + 20) sai = tAnt + (c.t - tAnt) * 0.3;
          const dx = p.x - p0.x;
          const dy = p.y - p0.y;
          const len = Math.hypot(dx, dy) || 1;
          const curva = sorte(-0.22, 0.22) * len;
          kf.push({ offset: sai / TOTAL, transform: tr(p0), easing: 'cubic-bezier(.5,0,.8,.6)' });
          kf.push({ offset: (sai + c.t) / 2 / TOTAL, transform: tr({ x: (p0.x + p.x) / 2 - (dy / len) * curva, y: (p0.y + p.y) / 2 + (dx / len) * curva }), easing: 'cubic-bezier(.2,.5,.3,1)' });
          kf.push({ offset: c.t / TOTAL, transform: tr(p) });
          p0 = p;
          tAnt = c.t;
          // o clipe "cai" quando o ponteiro chega
          c.el.animate(
            c.ponto ? [{ opacity: 0, transform: 'scale(0)' }, { opacity: 1, transform: 'scale(1)' }] : [{ opacity: 0, transform: 'scaleX(.08)' }, { opacity: 1, transform: 'scaleX(1)' }],
            { delay: c.t, duration: c.ponto ? 200 : 300, easing: 'cubic-bezier(.2,.9,.25,1.1)', fill: 'both' },
          );
          if (c.fid !== 'efeitos') {
            const cena = E.cenas[c.i];
            const [tag, txt] = c.fid === 'cenas' ? [`cena-${pad2(c.i + 1)}`, `${cena.layout} · ${cena.nome}`]
              : c.fid === 'texto' ? [`txt-${pad2(c.i + 1)}`, `"${cena.texto}"`] : [`pers-${pad2(c.i + 1)}`, `${cena.personagem} · ${cena.movimento}`];
            timers.push(setTimeout(() => registrar(AGENTES[a][1], tag, txt), c.t + 120));
          }
        }
        kf.push({ offset: FIM / TOTAL, transform: tr({ x: p0.x + 6, y: p0.y + 4 }), opacity: 1 });
        kf.push({ offset: 1, transform: tr({ x: p0.x + 10, y: p0.y + 8 }), opacity: 0 });
        cur.animate(kf, { duration: TOTAL, fill: 'both' });
      });

      // sons: teclado o tempo todo, pop leve quando uma cena cai, sininho no fim
      carregar(SONS_MINI).then(() => {
        if (estado !== 'montando' || !ctx) return;
        const t0 = ctx.currentTime - (performance.now() - inicio) / 1000;
        agendaTeclas(Math.max(ctx.currentTime, t0), t0 + FIM / 1000 - 0.15);
        ordem.filter((c) => c.fid === 'cenas').forEach((c) => {
          const em = t0 + c.t / 1000;
          if (em > ctx.currentTime) tocar('pop', { em, ganho: 0.06, taxa: sorte(0.9, 1.1) });
        });
        tocar('sino', { em: t0 + FIM / 1000, ganho: 0.55 });
      });

      // barra varrendo, como a renderização do estúdio (o palco mostra os quadros passando);
      // depois volta deslizando e o vídeo começa
      const inicio = performance.now();
      let ultimaBusca = 0;
      const passo = (agora) => {
        if (estado !== 'montando') return;
        const el = agora - inicio;
        if (el < FIM) {
          const p = clamp((el - INI) / VARRE);
          setP(p);
          if (p > 0 && !video.seeking && agora - ultimaBusca > 110) {
            ultimaBusca = agora;
            video.currentTime = Math.min(p * D, D - 0.1);
          }
          faixas.style.setProperty('--rev', vozFrac(p));
          faixas.style.setProperty('--pv', 0);
          elQuadros.textContent = `${Math.round(p * QUADROS)}/${QUADROS} quadros`;
          elTempo.textContent = tempo(p * D);
        } else if (el < FIM + 140) {
          setP(1);
          faixas.style.setProperty('--pv', 0);
          elQuadros.textContent = `${QUADROS}/${QUADROS} quadros`;
          elEstado.textContent = 'revisão ok';
        } else if (el < FIM + 140 + VOLTA) {
          const p = 1 - suave((el - FIM - 140) / VOLTA);
          setP(p);
          faixas.style.setProperty('--pv', 0);
          elTempo.textContent = tempo(p * D);
        } else {
          terminar();
          return;
        }
        rafMontagem = requestAnimationFrame(passo);
      };
      rafMontagem = requestAnimationFrame(passo);
    };

    // --- controles ---
    btnMontar.addEventListener('click', montar);
    btnRemontar.addEventListener('click', montar);
    btnPlay.addEventListener('click', () => {
      if (estado === 'vazio') return montar();
      if (estado !== 'pronto') return;
      audio();
      if (video.paused) video.play(); else video.pause();
    });
    btnLegenda.addEventListener('click', () => {
      const tr = video.textTracks[0];
      if (!tr) return;
      const on = tr.mode !== 'showing';
      tr.mode = on ? 'showing' : 'hidden';
      btnLegenda.setAttribute('aria-pressed', String(on));
    });
    btnSom.addEventListener('click', () => {
      somLigado = !somLigado;
      video.muted = !somLigado;
      if (mestre) mestre.gain.value = somLigado ? 1 : 0;
      btnSom.setAttribute('aria-pressed', String(somLigado));
      btnSom.textContent = somLigado ? 'som ligado' : 'som desligado';
    });

    // arrastar a cabeça de leitura pela timeline
    const buscar = (x) => {
      fim.hidden = true;
      const r = faixas.getBoundingClientRect();
      video.currentTime = clamp((x - r.left) / r.width) * D;
      quadro();
    };
    faixas.addEventListener('pointerdown', (e) => {
      if (estado !== 'pronto') return;
      faixas.setPointerCapture(e.pointerId);
      buscar(e.clientX);
      const mover = (ev) => buscar(ev.clientX);
      const soltar = () => { faixas.removeEventListener('pointermove', mover); faixas.removeEventListener('pointerup', soltar); faixas.removeEventListener('pointercancel', soltar); };
      faixas.addEventListener('pointermove', mover);
      faixas.addEventListener('pointerup', soltar);
      faixas.addEventListener('pointercancel', soltar);
    });
    faixas.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        btnPlay.click();
        return;
      }
      if (estado !== 'pronto') return;
      const t = video.currentTime;
      const i = cenaEm(t);
      const mapa = {
        ArrowRight: t + (e.shiftKey ? 5 : 1), ArrowLeft: t - (e.shiftKey ? 5 : 1), Home: 0, End: D - 0.05,
        PageDown: E.cenas[Math.min(i + 1, E.cenas.length - 1)].de, PageUp: E.cenas[Math.max(i - 1, 0)].de,
      };
      if (!(e.key in mapa)) return;
      e.preventDefault();
      video.currentTime = clamp(mapa[e.key], 0, D - 0.05);
      quadro();
    });

    // pré-carrega os sons da montagem quando o navegador estiver livre
    (window.requestIdleCallback || ((f) => setTimeout(f, 1200)))(() => carregar(SONS_MINI));
  }

  // ================= monte o seu =================
  const palco = $('#lab-palco');
  if (palco) {
    const form = $('#lab-form');
    const campo = (id) => $('#' + id);
    const botoesCena = $$('.lab-cenas button');
    const btnPausa = $('#lab-pausa');
    const lab = $('.lab');
    const json = $('#lab-json');
    const status = $('#lab-status');
    const DUR = 2800;
    let atual = 0;
    let pausado = reduzir;
    let timer = 0;
    let visivel = false;
    let ultimoJson = '';

    const valores = () => {
      const nome = campo('f-nome').value.trim() || 'Seu produto';
      const faz = (campo('f-faz').value.trim() || 'resolve o problema do seu cliente').replace(/[.!?\s]+$/, '');
      const dor = campo('f-dor').value.trim() || 'Seu cliente perde tempo com isso todo dia.';
      const cor = $('input[name=cor]:checked', form)?.value || '#1D5BFF';
      return { nome, faz, dor, cor };
    };
    const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'meu-produto';

    // texto palavra por palavra; as últimas palavras (ou um trecho) em destaque
    const palavras = (alvo, texto, destaque = 0, base = 0) => {
      const ws = texto.split(/\s+/).filter(Boolean);
      ws.forEach((w, k) => {
        const s = document.createElement('span');
        s.className = 'w';
        s.style.setProperty('--i', base + k);
        s.textContent = w;
        const dentro = destaque && k >= ws.length - destaque;
        if (dentro) { const em = document.createElement('em'); em.append(s); alvo.append(em); } else alvo.append(s);
        alvo.append(' ');
      });
      return base + ws.length;
    };
    const el = (tag, cls, filhos = []) => {
      const e = document.createElement(tag);
      if (cls) e.className = cls;
      e.append(...filhos);
      return e;
    };

    const desenhar = () => {
      const v = valores();
      palco.style.setProperty('--cor', v.cor);
      palco.replaceChildren();
      // 1 · dor
      const t1 = el('p', 't');
      palavras(t1, v.dor, Math.min(3, Math.max(1, v.dor.split(/\s+/).length - 3)));
      palco.append(el('div', 'lc claro', [t1, el('div', 'forma'), el('span', 'rodape', ['cena 01 · dividido'])]));
      // 2 · logo
      const pre = el('p', 'pre', ['Por isso a gente criou o']);
      const logo = el('p', 'logo');
      palavras(logo, v.nome, 0, 2);
      palco.append(el('div', 'lc marca', [pre, logo, el('span', 'rodape', ['cena 02 · logo'])]));
      // 3 · app
      const t3 = el('p', 't');
      const k = palavras(t3, `O ${v.nome}`, 0);
      palavras(t3, v.faz + '.', v.faz.split(/\s+/).length, k);
      const tela = el('div', 'tela', [
        el('div', 'app', [el('i'), v.nome]),
        el('div', 'busca', [v.faz]),
        ...[0, 1, 2].map((i) => { const it = el('div', 'item' + (i === 0 ? ' novo' : '')); it.style.setProperty('--i', i); return it; }),
      ]);
      palco.append(el('div', 'lc claro', [t3, el('div', 'celular', [tela]), el('span', 'rodape', ['cena 03 · celular'])]));
      // 4 · chamada
      const t4 = el('p', 't');
      const k4 = palavras(t4, 'Quer conhecer o', 0);
      palavras(t4, v.nome + '?', v.nome.split(/\s+/).length, k4);
      const chave = v.nome.toUpperCase();
      palco.append(el('div', 'lc claro', [t4, el('div', 'comentario', [el('div', 'quem', [el('i'), 'você']), 'Comenta a palavra abaixo que eu te mando o link:', el('span', 'chave', [chave])]), el('span', 'rodape', ['cena 04 · comentario'])]));
      mostrar(atual, false);
      escreverJson(v);
    };

    const mostrar = (i, reiniciar = true) => {
      atual = i;
      $$('.lc', palco).forEach((c, k) => c.classList.toggle('ativa', k === i));
      botoesCena.forEach((b, k) => {
        b.setAttribute('aria-pressed', String(k === i));
        if (k === i && reiniciar) { b.style.animation = 'none'; void b.offsetWidth; b.style.animation = ''; }
      });
      agendar();
    };
    const agendar = () => {
      clearTimeout(timer);
      if (pausado || !visivel) return;
      timer = setTimeout(() => mostrar((atual + 1) % 4), DUR);
    };
    lab.style.setProperty('--dur', DUR / 1000 + 's');
    lab.classList.toggle('pausado', pausado);
    btnPausa.setAttribute('aria-pressed', String(pausado));
    btnPausa.textContent = pausado ? 'tocar' : 'pausar';

    botoesCena.forEach((b, k) => b.addEventListener('click', () => mostrar(k)));
    btnPausa.addEventListener('click', () => {
      pausado = !pausado;
      lab.classList.toggle('pausado', pausado);
      btnPausa.setAttribute('aria-pressed', String(pausado));
      btnPausa.textContent = pausado ? 'tocar' : 'pausar';
      if (!pausado) mostrar(atual); else clearTimeout(timer);
    });

    // filme.json no mesmo formato do roteiro do estúdio
    const realceJson = (s) => s
      .replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])
      .replace(/("(?:[^"\\]|\\.)*")(\s*:)?|\b(\d+(?:\.\d+)?)\b/g, (m, str, dois, num) => {
        if (str) return dois ? `<span class="k">${str}</span>${dois}` : `<span class="s">${str}</span>`;
        return `<span class="n">${num}</span>`;
      });
    const escreverJson = (v) => {
      const s = slug(v.nome);
      const vídeo = {
        titulo: `${v.nome} — anúncio`,
        app: v.nome,
        formato: { largura: 1920, altura: 1080, fps: 60 },
        cores: { primaria: v.cor, destaque: '#FFC22E', claro: '#F6F3EE', escuro: '#0E1116', tinta: '#15171C' },
        cenas: [
          { id: 'dor', layout: 'dividido', fundo: 'claro', fala: v.dor, texto: v.dor, movimento: 'balanco' },
          { id: 'logo', layout: 'logo', fundo: 'azul', fala: `Por isso a gente criou o ${v.nome}.`, texto: 'Por isso a gente criou o' },
          { id: 'app', layout: 'celular', fundo: 'claro', fala: `O ${v.nome} ${v.faz}.`, texto: `O ${v.nome} *${v.faz}*.` },
          { id: 'comenta', layout: 'comentario', fundo: 'claro', fala: `Quer conhecer o ${v.nome}? Comenta ${v.nome}, que eu te mando o link.`, texto: `Quer conhecer o *${v.nome}*?`, palavraChave: v.nome.toUpperCase() },
        ],
      };
      const texto = JSON.stringify(vídeo, null, 2);
      $('#lab-caminho').textContent = `filmes/${s}/filme.json`;
      if (texto === ultimoJson) return;
      ultimoJson = texto;
      json.innerHTML = realceJson(texto);
      json.parentElement.classList.remove('mudou');
      void json.parentElement.offsetWidth;
      json.parentElement.classList.add('mudou');
    };

    let espera = 0;
    form.addEventListener('input', () => { clearTimeout(espera); espera = setTimeout(desenhar, 140); });
    form.addEventListener('submit', (e) => e.preventDefault());
    $('#lab-copiar').addEventListener('click', async () => {
      const b = $('#lab-copiar');
      try {
        await navigator.clipboard.writeText(ultimoJson);
        b.textContent = 'copiado';
        status.textContent = 'Roteiro copiado.';
      } catch {
        b.textContent = 'não deu';
        status.textContent = 'Não consegui copiar. Selecione o texto do roteiro e copie à mão.';
      }
      setTimeout(() => { b.textContent = 'copiar'; }, 1600);
    });

    // só anima quando está na tela
    new IntersectionObserver(([e]) => { visivel = e.isIntersecting; if (visivel) mostrar(atual); else clearTimeout(timer); }, { threshold: 0.25 }).observe(palco);
    document.addEventListener('visibilitychange', () => { if (document.hidden) clearTimeout(timer); else agendar(); });
    desenhar();
  }

  // ================= mesa de sons =================
  const pads = $('#pads');
  if (pads) {
    const PADS = [
      ['pop', 'pop', '#f472b6'], ['whoosh', 'whoosh', '#c084fc'], ['batida', 'batida', '#f87171'],
      ['tecla1', 'tecla', '#a3e635'], ['brilho', 'brilho', '#fdba74'], ['sino', 'sino', '#fbbf24'],
    ];
    const codigo = $('#py-codigo');
    const nomeFn = $('#py-nome');
    const PY = /(#.*$)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")|\b(def|return|for|in|if|else|elif|import|from|as|and|or|not|None|True|False|while|with)\b|\b(\d+(?:\.\d+)?(?:e-?\d+)?)\b|\b([a-z_]\w*)(?=\()/gm;
    const realcePy = (s) => s
      .replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])
      .replace(PY, (m, cm, str, kw, num, fn) => {
        if (cm) return `<span class="cm">${cm}</span>`;
        if (str) return `<span class="s">${str}</span>`;
        if (kw) return `<span class="kw">${kw}</span>`;
        if (num) return `<span class="n">${num}</span>`;
        return `<span class="fn">${fn}</span>`;
      });
    const mostrarCodigo = (id) => {
      const fonte = E.codigo[id] || '';
      const ultima = [...fonte.matchAll(/^def (\w+)\(/gm)].pop();
      nomeFn.textContent = ultima ? `def ${ultima[1]}()` : '';
      codigo.innerHTML = realcePy(fonte);
    };

    const botoes = PADS.map(([id, rotulo, cor]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pad';
      b.style.setProperty('--c', cor);
      b.setAttribute('aria-pressed', 'false');
      b.setAttribute('aria-label', `Tocar o som ${rotulo} e ver o código`);
      b.innerHTML = `<b>${rotulo}<small></small></b><svg viewBox="0 0 48 20" preserveAspectRatio="none" aria-hidden="true">${Array.from({ length: 24 }, (_, i) => `<rect x="${i * 2}" y="9.4" width="1.2" height="1.2"/>`).join('')}</svg>`;
      b.addEventListener('click', async () => {
        audio();
        await carregar([id]);
        tocar(id, { ganho: id === 'zumbido' ? 0.6 : 0.85 });
        botoes.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
        mostrarCodigo(id);
        const buf = buffers[id];
        b.style.setProperty('--dur', (buf ? buf.duration : 0.4) + 's');
        b.classList.remove('tocando');
        void b.offsetWidth;
        b.classList.add('tocando');
      });
      b.addEventListener('animationend', () => b.classList.remove('tocando'));
      pads.append(b);
      return b;
    });

    // desenha a onda de cada som quando a mesa chega perto da tela
    const desenharOndas = () => carregar(PADS.map((p) => p[0])).then(() => {
      PADS.forEach(([id], k) => {
        const buf = buffers[id];
        if (!buf) return;
        const d = buf.getChannelData(0);
        const N = 48;
        const passo = Math.floor(d.length / N);
        let rects = '';
        for (let i = 0; i < N; i++) {
          let pico = 0;
          for (let j = i * passo; j < (i + 1) * passo; j += 8) pico = Math.max(pico, Math.abs(d[j]));
          const h = Math.max(1, pico * 19);
          rects += `<rect x="${i}" y="${(10 - h / 2).toFixed(2)}" width=".6" height="${h.toFixed(2)}"/>`;
        }
        $('svg', botoes[k]).innerHTML = rects;
        $('small', botoes[k]).textContent = buf.duration < 1 ? `${Math.round(buf.duration * 1000)} ms` : `${buf.duration.toFixed(1)} s`;
      });
    });
    new IntersectionObserver(([e], o) => { if (e.isIntersecting) { o.disconnect(); desenharOndas(); } }, { rootMargin: '400px' }).observe(pads);

    botoes[5].setAttribute('aria-pressed', 'true');
    mostrarCodigo('sino');
  }
})();
