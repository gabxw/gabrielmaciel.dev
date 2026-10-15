// Gera os pontos dos continentes usados no globo do hero.
// Rodar só quando quiser mudar a densidade: node scripts/gerar-globo.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { feature } from 'topojson-client';
import { geoContains } from 'd3-geo';

const topo = JSON.parse(readFileSync(new URL('../node_modules/world-atlas/land-110m.json', import.meta.url)));
const land = feature(topo, topo.objects.land);

// Pontos espalhados por igual na esfera (espiral de Fibonacci); ficam só os que caem em terra.
const total = 52000;
const golden = Math.PI * (3 - Math.sqrt(5));
const points = [];
for (let i = 0; i < total; i++) {
  const y = 1 - (i / (total - 1)) * 2;
  const theta = golden * i;
  const lat = Math.asin(y) * (180 / Math.PI);
  const lon = ((((theta * 180) / Math.PI) % 360) + 540) % 360 - 180;
  if (geoContains(land, [lon, lat])) points.push(Math.round(lat * 10), Math.round(lon * 10));
}

writeFileSync(new URL('../src/data/globe-points.json', import.meta.url), JSON.stringify(points));
console.log(`${points.length / 2} pontos em terra`);
