// Gemeinsame 3D-Bausteine für Konfigurator und Fotostudio, damit beide gleich aussehen.
import * as THREE from 'three';

export const METALLIC = { gold: 0.55, silver: 0.55 };

// Wandelt das Ergebnis des Rechners in eine Three.js-Geometrie: Öse im Ursprung, Dicke zentriert.
export function buildGeometry({ vertices, indices, stride, meta }) {
  const positions = new Float32Array((vertices.length / stride) * 3);
  for (let i = 0, n = vertices.length / stride; i < n; i++) {
    positions.set(vertices.subarray(i * stride, i * stride + 3), i * 3);
  }
  const indexed = new THREE.BufferGeometry();
  indexed.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  indexed.setIndex(new THREE.BufferAttribute(indices, 1));
  const [, holeY] = meta.expected.holeCenterMm;
  indexed.translate(0, -holeY, -meta.expected.thicknessMm / 2);
  // Flächen getrennt, damit die Kanten scharf bleiben wie beim gedruckten Teil.
  const flat = indexed.toNonIndexed();
  flat.computeVertexNormals();
  indexed.dispose();
  return flat;
}

export function applyColor(material, { id, hex }) {
  material.color.set(hex);
  material.metalness = METALLIC[id] ?? 0;
  material.roughness = METALLIC[id] ? 0.34 : 0.42;
}

export const newOrnamentMaterial = () => new THREE.MeshPhysicalMaterial({
  color: '#ede6d6', roughness: 0.42, clearcoat: 0.25, clearcoatRoughness: 0.5,
});
