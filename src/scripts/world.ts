// Fundo da home: um único conjunto de partículas que muda de forma com a rolagem.
// Topo: globo só com os continentes, Belo Horizonte marcada e arcos saindo dela.
// Sobre e trajetória: um terreno em onda. Projetos em diante: uma galáxia em espiral.
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { currentScheme } from './theme';
import landPoints from '../data/globe-points.json';

gsap.registerPlugin(ScrollTrigger);

const RADIUS = 2.25;
const BH = { lat: -19.92, lon: -43.94 };
// Destinos dos arcos: só desenho, saindo de BH para o mundo.
const DESTINATIONS = [
  { lat: -23.55, lon: -46.63 },
  { lat: 38.72, lon: -9.14 },
  { lat: 40.71, lon: -74.0 },
  { lat: 35.68, lon: 139.69 },
  { lat: -34.6, lon: -58.38 },
  { lat: 51.5, lon: -0.12 },
  { lat: -33.92, lon: 18.42 },
  { lat: 19.43, lon: -99.13 },
  { lat: 52.52, lon: 13.4 },
];

const palette = {
  dark: { a: new THREE.Color('#4ade80'), b: new THREE.Color('#bbf7d0'), arc: new THREE.Color('#4ade80'), opacity: 1, blending: THREE.AdditiveBlending },
  light: { a: new THREE.Color('#15803d'), b: new THREE.Color('#22c55e'), arc: new THREE.Color('#16a34a'), opacity: 0.9, blending: THREE.NormalBlending },
};

/** Latitude e longitude para um ponto na esfera, com Belo Horizonte de frente para a câmera. */
function toSphere(lat: number, lon: number, r = RADIUS) {
  const la = THREE.MathUtils.degToRad(lat);
  const lo = THREE.MathUtils.degToRad(lon - BH.lon);
  return new THREE.Vector3(r * Math.cos(la) * Math.sin(lo), r * Math.sin(la), r * Math.cos(la) * Math.cos(lo));
}

const vertex = /* glsl */ `
  attribute vec3 aGlobe;
  attribute vec3 aWave;
  attribute vec3 aGalaxy;
  attribute vec3 aScatter;
  attribute vec4 aRand;

  uniform float uTime;
  uniform float uIntro;
  uniform float uMorph;
  uniform float uSpin;
  uniform float uTilt;
  uniform vec3 uGlobeOffset;
  uniform float uGlobeScale;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec2 uMouse;
  uniform float uMouseForce;
  uniform float uAspect;

  varying float vAlpha;
  varying float vTone;

  mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0., -s, 0., 1., 0., s, 0., c); }
  mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1., 0., 0., 0., c, s, 0., -s, c); }
  float ease(float t) { return t * t * (3. - 2. * t); }

  void main() {
    // Globo girando, com o lado de trás mais apagado.
    vec3 globeDir = rotX(uTilt) * rotY(uSpin) * aGlobe;
    vec3 globe = globeDir * uGlobeScale + uGlobeOffset;
    float front = smoothstep(-0.55, 0.35, globeDir.z / ${RADIUS.toFixed(2)});

    // Terreno: uma malha de pontos ondulando devagar.
    vec3 wave = vec3(
      aWave.x,
      sin(aWave.x * 0.5 + uTime * 0.55) * 0.42 + cos(aWave.z * 0.65 + uTime * 0.4 + aWave.x * 0.18) * 0.32,
      aWave.z
    );
    // Inclina o terreno para ele ser visto de cima, como um chão que some no horizonte.
    wave = rotX(0.42) * wave + vec3(0., -2.1, -0.5);

    // Galáxia: braços em espiral girando bem devagar.
    // Inclinada para mostrar os braços, e não só a borda.
    vec3 galaxy = rotX(1.05) * rotY(uTime * 0.035) * aGalaxy + vec3(2.8, -0.3, -3.2);

    // Cada partícula muda de forma num momento um pouco diferente, o que dá o efeito de onda.
    float t1 = ease(clamp((uMorph - aRand.x * 0.35) / 0.65, 0., 1.));
    float t2 = ease(clamp((uMorph - 1. - aRand.x * 0.35) / 0.65, 0., 1.));
    vec3 p = mix(mix(globe, wave, t1), galaxy, t2);

    // No meio da troca as partículas fazem um redemoinho.
    float swirl = sin(t1 * 3.14159) + sin(t2 * 3.14159);
    p += vec3(sin(aRand.y * 40. + uTime), cos(aRand.z * 40. + uTime * 0.8), sin(aRand.w * 40.)) * swirl * 0.28;

    // Entrada: partículas espalhadas pelo espaço que se juntam.
    float intro = ease(clamp(uIntro * 1.5 - aRand.y * 0.5, 0., 1.));
    p = mix(aScatter, p, intro);

    vec4 mv = modelViewMatrix * vec4(p, 1.);
    vec4 clip = projectionMatrix * mv;

    // O ponteiro empurra as partículas que estão perto dele.
    vec2 ndc = clip.xy / clip.w;
    vec2 d = ndc - uMouse;
    d.x *= uAspect;
    float push = smoothstep(0.32, 0., length(d)) * uMouseForce;
    clip.xy += normalize(d + 1e-5) * push * 0.07 * clip.w;

    gl_Position = clip;
    gl_PointSize = uSize * (0.55 + aRand.z * 0.9) * uPixelRatio / -mv.z;

    float globeAlpha = mix(0.18, 1., front);
    vAlpha = mix(globeAlpha, 0.6, max(t1, t2)) * intro;
    vTone = aRand.w;
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vTone;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.15, d);
    gl_FragColor = vec4(mix(uColorA, uColorB, vTone * vTone), soft * vAlpha * uOpacity);
  }
`;

const arcVertex = /* glsl */ `
  attribute float aT;
  varying float vT;
  void main() {
    vT = aT;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
  }
`;

const arcFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uPhase;
  uniform float uOpacity;
  varying float vT;
  void main() {
    // Um pulso viaja de BH até o destino; o arco inteiro fica bem fraco por baixo.
    float head = fract(uTime * 0.28 + uPhase);
    float pulse = smoothstep(0.14, 0., abs(vT - head)) ;
    float base = 0.2;
    gl_FragColor = vec4(uColor, (base + pulse) * uOpacity);
  }
`;

export interface WorldOptions {
  canvas: HTMLCanvasElement;
  hero: HTMLElement;
  label?: HTMLElement | null;
}

export function mountWorld({ canvas, hero, label }: WorldOptions) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const small = () => innerWidth < 900;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'high-performance' });
  // Em tela pequena, menos pixels: o globo continua nítido e o celular não esquenta.
  renderer.setPixelRatio(Math.min(devicePixelRatio, small() ? 1.25 : 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 0, 8);

  // Geometria: mesma quantidade de partículas em todas as formas.
  // No celular usamos metade dos pontos, pulando um sim e um não.
  const stride = small() ? 2 : 1;
  const count = Math.floor(landPoints.length / 2 / stride);
  const globe = new Float32Array(count * 3);
  const wave = new Float32Array(count * 3);
  const galaxy = new Float32Array(count * 3);
  const scatter = new Float32Array(count * 3);
  const rand = new Float32Array(count * 4);

  const cols = Math.ceil(Math.sqrt(count * 2.4));
  const rows = Math.ceil(count / cols);
  for (let i = 0; i < count; i++) {
    const src = i * stride;
    const v = toSphere(landPoints[src * 2] / 10, landPoints[src * 2 + 1] / 10);
    globe.set([v.x, v.y, v.z], i * 3);

    const c = i % cols;
    const r = Math.floor(i / cols);
    wave.set([(c / cols - 0.5) * 22, 0, (r / rows) * -11 + 2.5], i * 3);

    const arm = i % 3;
    const dist = Math.pow(Math.random(), 0.7) * 6.2;
    const angle = dist * 1.05 + (arm * Math.PI * 2) / 3 + (Math.random() - 0.5) * 0.55;
    galaxy.set([Math.cos(angle) * dist, (Math.random() - 0.5) * (0.5 - dist * 0.04), Math.sin(angle) * dist], i * 3);

    const s = new THREE.Vector3().randomDirection().multiplyScalar(9 + Math.random() * 14);
    scatter.set([s.x, s.y, s.z], i * 3);

    rand.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
  }

  const geometry = new THREE.BufferGeometry();
  // A posição "de verdade" é calculada no shader; esta só serve para o bounding box.
  geometry.setAttribute('position', new THREE.BufferAttribute(globe, 3));
  geometry.setAttribute('aGlobe', new THREE.BufferAttribute(globe, 3));
  geometry.setAttribute('aWave', new THREE.BufferAttribute(wave, 3));
  geometry.setAttribute('aGalaxy', new THREE.BufferAttribute(galaxy, 3));
  geometry.setAttribute('aScatter', new THREE.BufferAttribute(scatter, 3));
  geometry.setAttribute('aRand', new THREE.BufferAttribute(rand, 4));

  const uniforms = {
    uTime: { value: 0 },
    uIntro: { value: reduced ? 1 : 0 },
    uMorph: { value: 0 },
    uSpin: { value: 0 },
    uTilt: { value: -0.3 },
    uGlobeOffset: { value: new THREE.Vector3() },
    uGlobeScale: { value: 1 },
    uSize: { value: 38 },
    uPixelRatio: { value: renderer.getPixelRatio() },
    uMouse: { value: new THREE.Vector2(9, 9) },
    uMouseForce: { value: 0 },
    uAspect: { value: innerWidth / innerHeight },
    uColorA: { value: new THREE.Color() },
    uColorB: { value: new THREE.Color() },
    uOpacity: { value: 1 },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms,
    transparent: true,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);

  // Marcador de BH e arcos giram junto com o globo.
  const globeGroup = new THREE.Group();
  globeGroup.rotation.order = 'XYZ';
  scene.add(globeGroup);

  const bh = toSphere(BH.lat, BH.lon, RADIUS * 1.005);
  const markerMat = new THREE.MeshBasicMaterial({ color: '#4ade80', transparent: true, depthWrite: false });
  const marker = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 16), markerMat);
  marker.position.copy(bh);
  const ringMat = new THREE.MeshBasicMaterial({ color: '#4ade80', transparent: true, side: THREE.DoubleSide, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.06, 0.08, 40), ringMat);
  ring.position.copy(bh);
  ring.lookAt(bh.clone().multiplyScalar(2));
  globeGroup.add(marker, ring);

  const arcMaterials: THREE.ShaderMaterial[] = [];
  DESTINATIONS.forEach((d, i) => {
    const a = bh.clone().normalize();
    const b = toSphere(d.lat, d.lon).normalize();
    const angle = a.angleTo(b);
    const segments = 80;
    const pos = new Float32Array((segments + 1) * 3);
    const ts = new Float32Array(segments + 1);
    for (let s = 0; s <= segments; s++) {
      const t = s / segments;
      // Interpolação esférica, levantando o meio do arco proporcional à distância.
      const p = a.clone().multiplyScalar(Math.sin((1 - t) * angle)).add(b.clone().multiplyScalar(Math.sin(t * angle))).divideScalar(Math.sin(angle));
      p.multiplyScalar(RADIUS * (1 + Math.sin(Math.PI * t) * angle * 0.22));
      pos.set([p.x, p.y, p.z], s * 3);
      ts[s] = t;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aT', new THREE.BufferAttribute(ts, 1));
    const mat = new THREE.ShaderMaterial({
      vertexShader: arcVertex,
      fragmentShader: arcFragment,
      uniforms: { uColor: { value: new THREE.Color() }, uTime: uniforms.uTime, uPhase: { value: i / DESTINATIONS.length }, uOpacity: { value: 0 } },
      transparent: true,
      depthWrite: false,
    });
    arcMaterials.push(mat);
    globeGroup.add(new THREE.Line(geo, mat));
  });

  function applyScheme() {
    const c = palette[currentScheme()];
    uniforms.uColorA.value.copy(c.a);
    uniforms.uColorB.value.copy(c.b);
    uniforms.uOpacity.value = c.opacity;
    material.blending = c.blending;
    material.needsUpdate = true;
    markerMat.color.copy(c.arc);
    ringMat.color.copy(c.arc);
    arcMaterials.forEach((m) => {
      m.uniforms.uColor.value.copy(c.arc);
      m.blending = c.blending;
      m.needsUpdate = true;
    });
  }
  applyScheme();
  window.addEventListener('schemechange', applyScheme);

  // Onde o globo fica: à direita no desktop, atrás do texto no celular.
  // O tamanho vem do próprio canvas (100lvh no CSS), que não muda quando a barra de
  // endereço do celular aparece ou some. Assim o globo não pula durante a rolagem.
  let lastW = 0;
  let lastH = 0;
  function layout() {
    const w = canvas.clientWidth || innerWidth;
    const h = canvas.clientHeight || innerHeight;
    if (w === lastW && h === lastH) return;
    lastW = w;
    lastH = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    uniforms.uAspect.value = w / h;
    uniforms.uPixelRatio.value = renderer.getPixelRatio();
    const visibleW = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z * camera.aspect;
    if (small()) {
      // No celular o globo cabe na largura da tela, mais para baixo, atrás do texto.
      uniforms.uGlobeOffset.value.set(0, -1.35, 0);
      uniforms.uGlobeScale.value = Math.min(0.8, (visibleW * 0.46) / RADIUS);
    } else {
      // Desloca proporcionalmente à largura visível, para o globo ficar na metade direita.
      uniforms.uGlobeOffset.value.set(visibleW * 0.21, -0.05, 0);
      uniforms.uGlobeScale.value = 0.84;
    }
    globeGroup.position.copy(uniforms.uGlobeOffset.value);
    globeGroup.scale.setScalar(uniforms.uGlobeScale.value);
  }
  layout();
  addEventListener('resize', layout);

  // Arrastar o globo no hero: gira com inércia.
  let spinVelocity = reduced ? 0 : 0.06;
  let dragging = false;
  let lastX = 0;
  hero.addEventListener('pointerdown', (e) => {
    if ((e.target as HTMLElement).closest('a, button')) return;
    dragging = true;
    lastX = e.clientX;
    hero.setPointerCapture(e.pointerId);
    hero.classList.add('is-dragging');
  });
  hero.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    uniforms.uSpin.value += dx * 0.006;
    spinVelocity = dx * 0.25;
  });
  const endDrag = () => {
    dragging = false;
    hero.classList.remove('is-dragging');
  };
  hero.addEventListener('pointerup', endDrag);
  hero.addEventListener('pointercancel', endDrag);

  // Posição do ponteiro na tela, para empurrar as partículas.
  let mouseTarget = 0;
  addEventListener('pointermove', (e) => {
    uniforms.uMouse.value.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    mouseTarget = finePointer && !reduced ? 1 : 0;
  });
  document.addEventListener('pointerleave', () => (mouseTarget = 0));

  // Rolagem: globo vira terreno, terreno vira galáxia.
  const morph = { a: 0, b: 0 };
  if (!reduced) {
    const about = document.querySelector('#about-title');
    const work = document.querySelector('#work-title');
    if (about) {
      gsap.to(morph, { a: 1, ease: 'none', scrollTrigger: { trigger: about, start: 'top 105%', end: 'top 25%', scrub: 0.8 } });
    }
    if (work) {
      gsap.to(morph, { b: 1, ease: 'none', scrollTrigger: { trigger: work, start: 'top 105%', end: 'top 25%', scrub: 0.8 } });
    }
    // Entrada: as partículas se juntam no globo.
    gsap.to(uniforms.uIntro, { value: 1, duration: 2.8, ease: 'power3.out', delay: 0.15 });
  }

  // Rótulo de BH acompanha o marcador na tela.
  const tmp = new THREE.Vector3();
  function placeLabel() {
    if (!label) return;
    tmp.copy(marker.position).applyMatrix4(globeGroup.matrixWorld);
    const facing = tmp.clone().sub(globeGroup.position).normalize().z;
    tmp.project(camera);
    const x = (tmp.x * 0.5 + 0.5) * innerWidth;
    const y = (-tmp.y * 0.5 + 0.5) * innerHeight;
    const visible = !small() && facing > 0.15 && uniforms.uMorph.value < 0.25 && uniforms.uIntro.value > 0.85;
    label.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translateY(-50%)`;
    label.style.opacity = visible ? '1' : '0';
  }

  let running = true;
  let last = performance.now();
  function frame(now: number) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    uniforms.uTime.value += reduced ? 0 : dt;

    if (!dragging && !reduced) {
      // Inércia do arraste voltando para a rotação lenta.
      spinVelocity += (0.06 - spinVelocity) * Math.min(dt * 1.5, 1);
      uniforms.uSpin.value += spinVelocity * dt;
    }

    uniforms.uMorph.value = morph.a + morph.b;
    uniforms.uMouseForce.value += (mouseTarget - uniforms.uMouseForce.value) * Math.min(dt * 4, 1);

    // Marcador pulsa; arcos e marcador somem quando o globo vira outra coisa.
    const globeVisible = Math.max(0, 1 - uniforms.uMorph.value * 3) * uniforms.uIntro.value;
    const pulse = (uniforms.uTime.value * 0.7) % 1;
    ring.scale.setScalar(1 + pulse * 3.5);
    ringMat.opacity = (1 - pulse) * globeVisible;
    markerMat.opacity = globeVisible;
    arcMaterials.forEach((m) => (m.uniforms.uOpacity.value = globeVisible));
    globeGroup.rotation.set(uniforms.uTilt.value, uniforms.uSpin.value, 0);
    globeGroup.visible = globeVisible > 0.01;

    // Fora do topo o fundo fica mais discreto, para o texto ser lido com conforto.
    const base = palette[currentScheme()].opacity;
    // No celular o texto ocupa a largura toda, então o fundo apaga mais.
    const fade = small() ? 0.75 : 0.58;
    uniforms.uOpacity.value = base * (1 - Math.min(uniforms.uMorph.value, 1) * fade);

    renderer.render(scene, camera);
    placeLabel();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) running = false;
    else if (!running) {
      running = true;
      last = performance.now();
      requestAnimationFrame(frame);
    }
  });

  canvas.classList.add('is-live');
}
