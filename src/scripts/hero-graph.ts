// Grafo 3D do hero: o caminho de um evento dentro do FlowForge.
// Webhook → API → Outbox → RabbitMQ → Worker → Destino.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { gsap } from 'gsap';
import { currentScheme } from './theme';

export interface NodeCopy {
  id: string;
  name: string;
  role: string;
}

export interface HeroCopy {
  nodes: NodeCopy[];
  log: Record<string, string>;
}

type NodeId = 'webhook' | 'api' | 'outbox' | 'queue' | 'worker' | 'target';

interface GraphNode {
  id: NodeId;
  mesh: THREE.Mesh;
  led: THREE.Mesh;
  label: HTMLElement;
  base: THREE.Vector3;
  pulse: number;
}

interface Packet {
  key: string;
  edge: number;
  t: number;
  speed: number;
  wait: number;
  state: 'moving' | 'held' | 'dedup' | 'done';
  mesh: THREE.Mesh;
  glow: THREE.Sprite;
  startedAt: number;
  fade: number;
  slot: number;
}

const palette = {
  light: { node: 0xffffff, nodeEdge: 0xbccbbf, line: 0x9fb3a5, signal: 0x22c55e, led: 0x16a34a, down: 0xd97706, dust: 0x4a8a62, fog: 0xeef3ee },
  dark: { node: 0x17241e, nodeEdge: 0x2f4339, line: 0x3b5348, signal: 0x4ade80, led: 0x4ade80, down: 0xfbbf24, dust: 0x4ade80, fog: 0x0c1411 },
};

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.25, 'rgba(255,255,255,0.45)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function mountHeroGraph(stage: HTMLElement, copy: HeroCopy) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const canvas = stage.querySelector('canvas')!;
  const labelsLayer = stage.querySelector<HTMLElement>('[data-labels]')!;
  const logList = document.querySelector<HTMLElement>('[data-log]');
  const status = document.querySelector<HTMLElement>('[data-status]');
  const queueButton = document.querySelector<HTMLButtonElement>('[data-action="queue"]');
  const pauseButton = document.querySelector<HTMLButtonElement>('[data-action="pause"]');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.6, 15);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x88a090, 1.6);
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(4, 8, 10);
  const rim = new THREE.DirectionalLight(0x4ade80, 1.2);
  rim.position.set(-6, -3, -6);
  scene.add(hemi, key, rim);

  const graph = new THREE.Group();
  scene.add(graph);

  // Posições pensadas para tela larga; em tela estreita o grafo vira vertical.
  const wide: Record<NodeId, [number, number, number]> = {
    webhook: [-5.4, 0.9, 0],
    api: [-3.25, -0.55, 0.7],
    outbox: [-1.05, 0.85, -0.5],
    queue: [1.1, -0.6, 0.45],
    worker: [3.25, 0.85, -0.3],
    target: [5.4, -0.45, 0.35],
  };
  const tall: Record<NodeId, [number, number, number]> = {
    webhook: [-0.9, 5.1, 0],
    api: [0.9, 3.1, 0.6],
    outbox: [-0.9, 1.05, -0.4],
    queue: [0.9, -1.05, 0.4],
    worker: [-0.9, -3.1, -0.2],
    target: [0.9, -5.1, 0.3],
  };
  const order: NodeId[] = ['webhook', 'api', 'outbox', 'queue', 'worker', 'target'];

  const scheme = () => palette[currentScheme()];
  let colors = scheme();

  const nodeGeo = new RoundedBoxGeometry(1.7, 0.95, 0.42, 6, 0.2);
  const ledGeo = new THREE.SphereGeometry(0.075, 20, 20);
  const nodes: GraphNode[] = order.map((id) => {
    const material = new THREE.MeshStandardMaterial({ color: colors.node, roughness: 0.55, metalness: 0.05, emissive: colors.signal, emissiveIntensity: 0 });
    const mesh = new THREE.Mesh(nodeGeo, material);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(nodeGeo, 30),
      new THREE.LineBasicMaterial({ color: colors.nodeEdge, transparent: true, opacity: 0.7 }),
    );
    mesh.add(edges);
    const led = new THREE.Mesh(ledGeo, new THREE.MeshBasicMaterial({ color: colors.led }));
    led.position.set(0.62, 0.3, 0.22);
    mesh.add(led);
    mesh.userData.id = id;
    graph.add(mesh);

    const info = copy.nodes.find((n) => n.id === id)!;
    const label = document.createElement('div');
    label.className = 'node-label';
    label.innerHTML = `<strong></strong><span></span>`;
    label.querySelector('strong')!.textContent = info.name;
    label.querySelector('span')!.textContent = info.role;
    labelsLayer.appendChild(label);
    return { id, mesh, led, label, base: new THREE.Vector3(), pulse: 0 };
  });

  // Arestas como tubos finos entre um nó e o próximo.
  const edgeMaterial = new THREE.MeshBasicMaterial({ color: colors.line, transparent: true, opacity: 0.9 });
  let curves: THREE.CatmullRomCurve3[] = [];
  const edgeMeshes: THREE.Mesh[] = [];

  function buildEdges() {
    edgeMeshes.forEach((m) => {
      graph.remove(m);
      m.geometry.dispose();
    });
    edgeMeshes.length = 0;
    curves = [];
    // As arestas saem da lateral de um nó e entram na lateral do próximo.
    const exit = layoutTall ? new THREE.Vector3(0, -0.5, 0) : new THREE.Vector3(0.88, 0, 0);
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = nodes[i].base.clone().add(exit);
      const b = nodes[i + 1].base.clone().sub(exit);
      const mid = a.clone().lerp(b, 0.5);
      mid.z += 0.35;
      const curve = new THREE.CatmullRomCurve3([a, a.clone().lerp(mid, 0.6), mid, b.clone().lerp(mid, 0.6), b]);
      curves.push(curve);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.022, 8, false), edgeMaterial);
      tube.renderOrder = -1;
      edgeMeshes.push(tube);
      graph.add(tube);
    }
  }

  let layoutTall = false;
  function layout() {
    const rect = stage.getBoundingClientRect();
    const aspect = rect.width / Math.max(rect.height, 1);
    layoutTall = aspect < 0.9;
    const map = layoutTall ? tall : wide;
    nodes.forEach((n) => {
      n.base.set(...map[n.id]);
      n.mesh.position.copy(n.base);
    });
    buildEdges();
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = aspect;
    // Afasta a câmera até o grafo inteiro caber.
    const span = layoutTall ? 4.6 : 13.6;
    const fov = THREE.MathUtils.degToRad(camera.fov);
    const fitWidth = span / 2 / Math.tan(fov / 2) / aspect;
    const fitHeight = (layoutTall ? 12.6 : 4.4) / 2 / Math.tan(fov / 2);
    camera.userData.distance = Math.max(fitWidth, fitHeight) + 1.2;
    camera.position.setLength(camera.userData.distance);
    camera.updateProjectionMatrix();
  }

  // Poeira ao fundo, para dar profundidade.
  const dustGeo = new THREE.BufferGeometry();
  const dustCount = 420;
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 30;
    dustPos[i * 3 + 1] = (Math.random() - 0.5) * 16;
    dustPos[i * 3 + 2] = -3 - Math.random() * 10;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({ color: colors.dust, size: 0.05, transparent: true, opacity: 0.45, depthWrite: false });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  const glowTex = glowTexture();
  const packetGeo = new THREE.SphereGeometry(0.11, 24, 24);

  function recolor() {
    colors = scheme();
    nodes.forEach((n) => {
      const m = n.mesh.material as THREE.MeshStandardMaterial;
      m.color.set(colors.node);
      m.emissive.set(colors.signal);
      ((n.mesh.children[0] as THREE.LineSegments).material as THREE.LineBasicMaterial).color.set(colors.nodeEdge);
      (n.led.material as THREE.MeshBasicMaterial).color.set(n.id === 'queue' && queueDown ? colors.down : colors.led);
    });
    edgeMaterial.color.set(colors.line);
    dustMat.color.set(colors.dust);
    packets.forEach((p) => {
      (p.mesh.material as THREE.MeshBasicMaterial).color.set(p.state === 'dedup' ? colors.down : colors.signal);
      (p.glow.material as THREE.SpriteMaterial).color.set(colors.signal);
      (p.glow.material as THREE.SpriteMaterial).blending = currentScheme() === 'dark' ? THREE.AdditiveBlending : THREE.NormalBlending;
    });
    hemi.intensity = currentScheme() === 'dark' ? 1.2 : 2.3;
  }
  window.addEventListener('schemechange', recolor);

  // Eventos
  const packets: Packet[] = [];
  const seen = new Set<string>();
  let queueDown = false;
  let held = 0;
  let counter = Math.floor(Math.random() * 4000) + 1000;

  const fmt = (template: string, vars: Record<string, string | number>) =>
    template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));

  function log(kind: string, vars: Record<string, string | number> = {}, announce = false) {
    const text = fmt(copy.log[kind], vars);
    if (logList) {
      const li = document.createElement('li');
      li.dataset.kind = kind;
      li.textContent = text;
      logList.prepend(li);
      while (logList.children.length > 6) logList.lastElementChild!.remove();
    }
    if (announce && status) status.textContent = text;
  }

  function spawn(keyOverride?: string, announce = false) {
    const key = keyOverride ?? `evt_${(counter++).toString(16)}`;
    const mesh = new THREE.Mesh(packetGeo, new THREE.MeshBasicMaterial({ color: colors.signal, transparent: true }));
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: colors.signal,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: currentScheme() === 'dark' ? THREE.AdditiveBlending : THREE.NormalBlending,
      }),
    );
    glow.scale.setScalar(0.85);
    mesh.add(glow);
    mesh.position.copy(nodes[0].base);
    graph.add(mesh);
    const packet: Packet = { key, edge: 0, t: 0, speed: 0.75 + Math.random() * 0.2, wait: 0.18, state: 'moving', mesh, glow, startedAt: performance.now(), fade: 1, slot: 0 };
    packets.push(packet);
    pulse(0);
    log('received', { key }, announce);
    return packet;
  }

  function pulse(index: number) {
    nodes[index].pulse = 1;
  }

  function arrive(p: Packet, nodeIndex: number) {
    const node = nodes[nodeIndex];
    pulse(nodeIndex);
    if (node.id === 'api') {
      if (seen.has(p.key)) {
        p.state = 'dedup';
        (p.mesh.material as THREE.MeshBasicMaterial).color.set(colors.down);
        log('dedup', { key: p.key }, true);
        return;
      }
      seen.add(p.key);
      log('created', { key: p.key, exe: p.key.replace('evt_', 'exe_') });
    }
    if (node.id === 'outbox' && queueDown) {
      p.state = 'held';
      p.slot = held++;
      log('held', { key: p.key, n: held }, true);
      return;
    }
    if (node.id === 'target') {
      p.state = 'done';
      log('done', { exe: p.key.replace('evt_', 'exe_'), ms: Math.round(performance.now() - p.startedAt) });
    }
  }

  function setQueue(down: boolean) {
    queueDown = down;
    const queueNode = nodes.find((n) => n.id === 'queue')!;
    (queueNode.led.material as THREE.MeshBasicMaterial).color.set(down ? colors.down : colors.led);
    queueNode.label.classList.toggle('is-down', down);
    if (queueButton) {
      queueButton.dataset.active = String(down);
      queueButton.querySelector('[data-label]')!.textContent = down ? queueButton.dataset.on! : queueButton.dataset.off!;
    }
    if (down) {
      log('down', {}, true);
    } else {
      const waiting = packets.filter((p) => p.state === 'held');
      log('up', { n: waiting.length }, true);
      waiting.forEach((p, i) => {
        setTimeout(() => {
          p.state = 'moving';
          p.wait = 0;
        }, i * 260);
      });
      held = 0;
    }
  }

  // Botões
  document.querySelector('[data-action="send"]')?.addEventListener('click', () => spawn(undefined, true));
  document.querySelector('[data-action="duplicate"]')?.addEventListener('click', () => {
    const key = `evt_${(counter++).toString(16)}`;
    spawn(key, true);
    setTimeout(() => spawn(key, true), 380);
  });
  queueButton?.addEventListener('click', () => setQueue(!queueDown));

  let autoplay = !reduced;
  pauseButton?.addEventListener('click', () => {
    autoplay = !autoplay;
    pauseButton.dataset.active = String(!autoplay);
    pauseButton.querySelector('[data-label]')!.textContent = autoplay ? pauseButton.dataset.off! : pauseButton.dataset.on!;
  });
  if (reduced && pauseButton) {
    pauseButton.dataset.active = 'true';
    pauseButton.querySelector('[data-label]')!.textContent = pauseButton.dataset.on!;
  }

  // Interação com o mouse: girar com limite, passar por cima, clicar.
  const controls = new OrbitControls(camera, canvas);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.5;
  controls.minAzimuthAngle = -0.7;
  controls.maxAzimuthAngle = 0.7;
  controls.minPolarAngle = Math.PI / 2 - 0.45;
  controls.maxPolarAngle = Math.PI / 2 + 0.35;
  controls.enabled = finePointer;

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(9, 9);
  const parallax = new THREE.Vector2();
  let hovered: GraphNode | null = null;

  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    parallax.copy(pointer);
  });
  canvas.addEventListener('pointerleave', () => {
    pointer.set(9, 9);
    parallax.set(0, 0);
  });
  let downAt = 0;
  canvas.addEventListener('pointerdown', () => (downAt = performance.now()));
  canvas.addEventListener('click', () => {
    if (performance.now() - downAt > 250 || !hovered) return;
    const i = nodes.indexOf(hovered);
    pulse(i);
    if (hovered.id === 'webhook') spawn(undefined, true);
    if (hovered.id === 'queue') setQueue(!queueDown);
  });

  // Ciclo de renderização
  let running = false;
  let visible = true;
  let last = performance.now();
  let nextAuto = 1.4;
  const tmp = new THREE.Vector3();
  const easeAlong = gsap.parseEase('power1.inOut');

  function updateLabels() {
    const r = stage.getBoundingClientRect();
    nodes.forEach((n) => {
      tmp.copy(n.mesh.position);
      tmp.y -= 0.78;
      tmp.applyMatrix4(graph.matrixWorld).project(camera);
      const x = (tmp.x * 0.5 + 0.5) * r.width;
      const y = (-tmp.y * 0.5 + 0.5) * r.height;
      n.label.style.transform = `translate(-50%, 0) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      n.label.classList.toggle('is-hover', hovered === n);
    });
  }

  function step(dt: number, now: number) {
    // Disparo automático
    if (autoplay && visible) {
      nextAuto -= dt;
      if (nextAuto <= 0) {
        spawn();
        nextAuto = 2.6 + Math.random() * 1.2;
      }
    }

    for (const p of packets) {
      if (p.state === 'moving') {
        if (p.wait > 0) {
          // Enquanto espera, o evento fica dentro do nó, escondido pela caixa.
          p.wait -= dt;
          p.mesh.position.copy(nodes[Math.min(p.edge, nodes.length - 1)].mesh.position);
          continue;
        }
        p.t += dt * p.speed;
        if (p.t >= 1) {
          p.t = 0;
          p.edge += 1;
          p.wait = 0.16;
          arrive(p, p.edge);
        }
        if (p.state === 'moving' && p.edge < curves.length) {
          curves[p.edge].getPointAt(easeAlong(p.t), p.mesh.position);
        }
      } else if (p.state === 'held') {
        // Eventos esperando na outbox ficam empilhados acima do nó.
        const outbox = nodes[2].mesh.position;
        tmp.set(outbox.x - 0.55 + (p.slot % 5) * 0.28, outbox.y + 0.75 + Math.floor(p.slot / 5) * 0.28, outbox.z + 0.25);
        p.mesh.position.lerp(tmp, 1 - Math.pow(0.0015, dt));
      } else {
        p.fade -= dt * (p.state === 'dedup' ? 1.6 : 2.2);
        const s = Math.max(p.fade, 0);
        p.mesh.scale.setScalar(p.state === 'done' ? 1 + (1 - s) * 1.6 : s);
        (p.mesh.material as THREE.MeshBasicMaterial).opacity = s;
        (p.glow.material as THREE.SpriteMaterial).opacity = s * 0.85;
      }
    }
    for (let i = packets.length - 1; i >= 0; i--) {
      const p = packets[i];
      if (p.fade <= 0) {
        graph.remove(p.mesh);
        (p.mesh.material as THREE.Material).dispose();
        (p.glow.material as THREE.Material).dispose();
        packets.splice(i, 1);
      }
    }

    // Nós respiram e acendem quando recebem um evento.
    nodes.forEach((n, i) => {
      n.pulse = Math.max(0, n.pulse - dt * 2.2);
      const m = n.mesh.material as THREE.MeshStandardMaterial;
      const hover = hovered === n ? 0.18 : 0;
      m.emissiveIntensity = n.pulse * 0.55 + hover;
      const s = 1 + n.pulse * 0.08;
      n.mesh.scale.set(s, s, s);
      if (!reduced && autoplay) n.mesh.position.y = n.base.y + Math.sin(now / 1100 + i * 1.3) * 0.06;
    });

    // Pausar também para a poeira e a respiração dos nós.
    if (autoplay) dust.rotation.y += dt * 0.012;

    // Paralaxe leve seguindo o mouse.
    if (!reduced && finePointer) {
      graph.rotation.y += (parallax.x * 0.08 - graph.rotation.y) * Math.min(dt * 3, 1);
      graph.rotation.x += (-parallax.y * 0.05 - graph.rotation.x) * Math.min(dt * 3, 1);
    }

    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(nodes.map((n) => n.mesh), false)[0];
    hovered = hit ? nodes.find((n) => n.mesh === hit.object) ?? null : null;
    canvas.style.cursor = hovered && (hovered.id === 'webhook' || hovered.id === 'queue') ? 'pointer' : finePointer ? 'grab' : '';
  }

  function frame(now: number) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    step(dt, now);
    controls.update();
    renderer.render(scene, camera);
    updateLabels();
    requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
  }

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !document.hidden) start();
    else stop();
  }).observe(stage);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (visible) start();
  });

  new ResizeObserver(() => layout()).observe(stage);
  layout();
  recolor();

  stage.classList.add('is-live');

  // Entrada: os nós aparecem em sequência e as arestas se desenham.
  if (!reduced) {
    const tl = gsap.timeline({ delay: 0.15 });
    nodes.forEach((n) => n.mesh.scale.setScalar(0.001));
    edgeMeshes.forEach((m) => m.geometry.setDrawRange(0, 0));
    const cam = { d: camera.userData.distance * 1.35 };
    camera.position.setLength(cam.d);
    tl.to(cam, { d: camera.userData.distance, duration: 2.2, ease: 'expo.out', onUpdate: () => camera.position.setLength(cam.d) }, 0);
    nodes.forEach((n, i) => {
      const proxy = { s: 0.001 };
      tl.to(proxy, { s: 1, duration: 0.9, ease: 'back.out(2.2)', onUpdate: () => n.mesh.scale.setScalar(proxy.s) }, 0.2 + i * 0.13);
    });
    edgeMeshes.forEach((m, i) => {
      const total = m.geometry.index!.count;
      const proxy = { p: 0 };
      tl.to(proxy, { p: 1, duration: 0.6, ease: 'power2.inOut', onUpdate: () => m.geometry.setDrawRange(0, Math.floor(total * proxy.p)) }, 0.45 + i * 0.13);
    });
    labelsLayer.style.opacity = '0';
    tl.to(labelsLayer, { opacity: 1, duration: 0.6 }, 1.1);
    tl.add(() => spawn(), 1.5);
  }

  // Ao rolar para fora do hero, o grafo gira um pouco e some.
  if (!reduced) {
    import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
      gsap.registerPlugin(ScrollTrigger);
      gsap.to(graph.rotation, {
        z: layoutTall ? 0 : -0.08,
        scrollTrigger: { trigger: stage, start: 'top top', end: 'bottom top', scrub: 0.6 },
      });
      gsap.to(stage, {
        opacity: 0.25,
        ease: 'none',
        scrollTrigger: { trigger: stage, start: 'center top', end: 'bottom top', scrub: true },
      });
    });
  }
}
