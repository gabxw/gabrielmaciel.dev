// Ferramentas como blocos com física: caem numa caixa e dá para pegar e arremessar.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import * as CANNON from 'cannon-es';
import { currentScheme } from './theme';

interface Block {
  mesh: THREE.Mesh;
  body: CANNON.Body;
  name: string;
}

const palette = {
  light: { face: '#f8fbf7', text: '#0f1c15', edge: '#bccbbf', accentFace: '#4ade80', accentText: '#052e16', floor: 0xe3ebe4 },
  dark: { face: '#17241e', text: '#e4ede7', edge: '#2f4339', accentFace: '#4ade80', accentText: '#052e16', floor: 0x111b17 },
};

/** Textura com o nome da ferramenta, desenhada num canvas. */
function labelTexture(name: string, w: number, h: number, accent: boolean) {
  const c = palette[currentScheme()];
  const scale = 128;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const g = canvas.getContext('2d')!;
  g.fillStyle = accent ? c.accentFace : c.face;
  g.fillRect(0, 0, canvas.width, canvas.height);
  g.fillStyle = accent ? c.accentText : c.text;
  let size = canvas.height * 0.42;
  g.font = `700 ${size}px "Bricolage Grotesque Variable", system-ui, sans-serif`;
  while (g.measureText(name).width > canvas.width * 0.82 && size > 10) {
    size -= 2;
    g.font = `700 ${size}px "Bricolage Grotesque Variable", system-ui, sans-serif`;
  }
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(name, canvas.width / 2, canvas.height / 2 + size * 0.04);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function mountStack(stage: HTMLElement, names: string[], highlight: string[]) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = stage.querySelector('canvas')!;
  const resetButton = document.querySelector<HTMLButtonElement>('[data-stack-reset]');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 7.5, 15);
  camera.lookAt(0, 0.6, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x7f9488, 1.5));
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(5, 12, 7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -10;
  sun.shadow.camera.right = 10;
  sun.shadow.camera.top = 10;
  sun.shadow.camera.bottom = -10;
  sun.shadow.radius = 6;
  scene.add(sun);

  const floorMat = new THREE.ShadowMaterial({ opacity: 0.18 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Física
  const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -22, 0) });
  world.allowSleep = true;
  const material = new CANNON.Material('block');
  world.addContactMaterial(new CANNON.ContactMaterial(material, material, { friction: 0.35, restitution: 0.25 }));

  const ground = new CANNON.Body({ mass: 0, shape: new CANNON.Plane(), material });
  ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(ground);

  // Paredes invisíveis que acompanham a largura visível.
  const walls: CANNON.Body[] = [];
  function placeWalls(halfWidth: number, halfDepth: number) {
    walls.forEach((w) => world.removeBody(w));
    walls.length = 0;
    const defs: [number, number, number, number][] = [
      [halfWidth, 0, 0, -Math.PI / 2],
      [-halfWidth, 0, 0, Math.PI / 2],
      [0, 0, -halfDepth, 0],
      [0, 0, halfDepth, Math.PI],
    ];
    defs.forEach(([x, , z, ry]) => {
      const wall = new CANNON.Body({ mass: 0, shape: new CANNON.Plane(), material });
      wall.position.set(x, 0, z);
      wall.quaternion.setFromEuler(0, ry, 0);
      world.addBody(wall);
      walls.push(wall);
    });
  }

  const blocks: Block[] = [];
  const geometries = new Map<string, THREE.BufferGeometry>();

  function makeBlock(name: string, index: number) {
    const accent = highlight.includes(name);
    const w = Math.max(1.4, 0.34 * name.length + 0.6);
    const h = 0.95;
    const d = 0.95;
    const keyGeo = `${w.toFixed(2)}`;
    if (!geometries.has(keyGeo)) geometries.set(keyGeo, new RoundedBoxGeometry(w, h, d, 4, 0.16));
    const c = palette[currentScheme()];
    const side = new THREE.MeshStandardMaterial({ color: accent ? c.accentFace : c.face, roughness: 0.6 });
    const face = new THREE.MeshStandardMaterial({ map: labelTexture(name, w, h, accent), roughness: 0.6 });
    // Ordem das faces do BoxGeometry: +x, -x, +y, -y, +z, -z. O nome vai na frente e atrás.
    const mesh = new THREE.Mesh(geometries.get(keyGeo)!, [side, side, side, side, face, face]);
    mesh.castShadow = true;
    mesh.userData.accent = accent;
    scene.add(mesh);

    const body = new CANNON.Body({
      mass: 1,
      shape: new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2)),
      material,
      angularDamping: 0.3,
      linearDamping: 0.05,
      sleepSpeedLimit: 0.15,
    });
    world.addBody(body);
    const block = { mesh, body, name };
    blocks.push(block);
    drop(block, index);
  }

  let halfWidth = 6;
  function drop(block: Block, index: number) {
    const body = block.body;
    body.velocity.setZero();
    body.angularVelocity.set((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
    body.position.set((Math.random() - 0.5) * halfWidth * 1.3, 6 + index * 1.1, (Math.random() - 0.5) * 2);
    body.quaternion.setFromEuler(Math.random() * 0.6, Math.random() * Math.PI, Math.random() * 0.6);
    body.wakeUp();
  }

  function settleInstantly() {
    // Movimento reduzido: simula a queda fora da tela e mostra o resultado parado.
    for (let i = 0; i < 600; i++) world.step(1 / 60);
    sync();
  }

  function recolor() {
    const c = palette[currentScheme()];
    blocks.forEach((b) => {
      const [side, , , , face] = b.mesh.material as THREE.MeshStandardMaterial[];
      side.color.set(b.mesh.userData.accent ? c.accentFace : c.face);
      face.map?.dispose();
      const params = (b.mesh.geometry as RoundedBoxGeometry).parameters;
      face.map = labelTexture(b.name, params.width, params.height, b.mesh.userData.accent);
      face.needsUpdate = true;
    });
    floorMat.opacity = currentScheme() === 'dark' ? 0.4 : 0.16;
  }
  window.addEventListener('schemechange', recolor);

  // Pegar e arremessar com o ponteiro, com uma junta entre o ponteiro e o bloco.
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const dragPlane = new THREE.Plane();
  const hitPoint = new THREE.Vector3();
  const jointBody = new CANNON.Body({ mass: 0 });
  jointBody.collisionFilterGroup = 0;
  jointBody.collisionFilterMask = 0;
  world.addBody(jointBody);
  let joint: CANNON.PointToPointConstraint | null = null;
  let grabbed: Block | null = null;

  function setPointer(e: PointerEvent) {
    const r = canvas.getBoundingClientRect();
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  }

  canvas.addEventListener('pointerdown', (e) => {
    setPointer(e);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(blocks.map((b) => b.mesh), false)[0];
    if (!hit) return;
    grabbed = blocks.find((b) => b.mesh === hit.object)!;
    canvas.setPointerCapture(e.pointerId);
    dragPlane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()).negate(), hit.point);
    jointBody.position.set(hit.point.x, hit.point.y, hit.point.z);
    const local = grabbed.body.pointToLocalFrame(new CANNON.Vec3(hit.point.x, hit.point.y, hit.point.z));
    joint = new CANNON.PointToPointConstraint(grabbed.body, local, jointBody, new CANNON.Vec3(0, 0, 0));
    world.addConstraint(joint);
    grabbed.body.wakeUp();
    canvas.classList.add('is-grabbing');
    start();
  });

  canvas.addEventListener('pointermove', (e) => {
    setPointer(e);
    if (!grabbed) {
      raycaster.setFromCamera(pointer, camera);
      canvas.style.cursor = raycaster.intersectObjects(blocks.map((b) => b.mesh), false).length ? 'grab' : '';
      return;
    }
    raycaster.setFromCamera(pointer, camera);
    if (raycaster.ray.intersectPlane(dragPlane, hitPoint)) {
      hitPoint.y = Math.max(hitPoint.y, 0.6);
      jointBody.position.set(hitPoint.x, hitPoint.y, hitPoint.z);
    }
  });

  const release = () => {
    if (joint) world.removeConstraint(joint);
    joint = null;
    grabbed = null;
    canvas.classList.remove('is-grabbing');
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  resetButton?.addEventListener('click', () => {
    blocks.forEach((b, i) => drop(b, i));
    if (reduced) settleInstantly();
    start();
  });

  function sync() {
    blocks.forEach((b) => {
      b.mesh.position.set(b.body.position.x, b.body.position.y, b.body.position.z);
      b.mesh.quaternion.set(b.body.quaternion.x, b.body.quaternion.y, b.body.quaternion.z, b.body.quaternion.w);
    });
  }

  function layout() {
    const r = stage.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / Math.max(r.height, 1);
    camera.updateProjectionMatrix();
    // Largura visível no chão, para as paredes ficarem dentro da tela.
    const dist = camera.position.length();
    const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * dist;
    halfWidth = Math.max(2.4, (visibleHeight * camera.aspect) / 2 - 1.2);
    placeWalls(halfWidth, 2.2);
  }

  // Loop: roda só enquanto a seção está visível e para quando tudo dorme.
  let running = false;
  let visible = false;
  let last = 0;
  function frame(now: number) {
    if (!running) return;
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    world.step(1 / 60, dt, 3);
    sync();
    renderer.render(scene, camera);
    const sleeping = blocks.every((b) => b.body.sleepState === CANNON.Body.SLEEPING) && !grabbed;
    if (sleeping) {
      running = false;
      return;
    }
    requestAnimationFrame(frame);
  }
  function start() {
    if (running || !visible) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }

  let dropped = false;
  new IntersectionObserver(
    async ([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !dropped) {
        dropped = true;
        // A textura usa a fonte do site; espera ela carregar antes de desenhar.
        await document.fonts.load('700 40px "Bricolage Grotesque Variable"').catch(() => {});
        layout();
        names.forEach((n, i) => makeBlock(n, i));
        recolor();
        if (reduced) settleInstantly();
        stage.classList.add('is-live');
      }
      if (visible) start();
      else running = false;
    },
    { threshold: 0.25 },
  ).observe(stage);

  new ResizeObserver(() => {
    layout();
    sync();
    renderer.render(scene, camera);
    start();
  }).observe(stage);

  // Quando o tema muda, redesenha mesmo com tudo parado.
  window.addEventListener('schemechange', () => renderer.render(scene, camera));
}
