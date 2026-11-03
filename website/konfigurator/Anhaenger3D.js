'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const VIEW_HEIGHT_MM = 190; // Feste Kamera: Größenunterschiede bleiben sichtbar
const THREAD_MM = 120;
const METALLIC = { gold: 0.55, silver: 0.55 };

function buildGeometry({ vertices, indices, stride, meta }) {
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

export default function Anhaenger3D({ model, color }) {
  const host = useRef(null);
  const api = useRef(null);

  useEffect(() => {
    const element = host.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    element.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.7;

    const camera = new THREE.PerspectiveCamera(24, 1, 10, 3000);
    const key = new THREE.DirectionalLight(0xffe8c8, 2.4);
    key.position.set(-90, 130, 200);
    const rim = new THREE.DirectionalLight(0xbfd6ff, 1.1);
    rim.position.set(160, -40, -120);
    scene.add(key, rim);

    const material = new THREE.MeshPhysicalMaterial({ color: '#ede6d6', roughness: 0.42, clearcoat: 0.25, clearcoatRoughness: 0.5 });
    const pivot = new THREE.Group();
    pivot.position.y = 50;
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
    pivot.add(mesh);

    const threadMaterial = new THREE.MeshStandardMaterial({ color: '#c7a76c', roughness: 0.6 });
    const thread = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, THREAD_MM, 8), threadMaterial);
    thread.position.y = THREAD_MM / 2;
    pivot.add(thread);
    scene.add(pivot);

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = element;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      // Schmale Ansichten brauchen mehr Abstand, damit die Breite ins Bild passt.
      const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const distance = Math.max(VIEW_HEIGHT_MM / (2 * tan), 125 / (2 * tan * camera.aspect));
      camera.position.set(0, 0, distance);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();

    // Ziehen dreht den Anhänger, vertikales Wischen scrollt weiter die Seite.
    const drag = { active: false, lastX: 0, lastY: 0, yaw: 0, pitch: 0, velocity: 0 };
    const down = (e) => {
      drag.active = true;
      drag.lastX = e.clientX;
      drag.lastY = e.clientY;
      element.setPointerCapture(e.pointerId);
    };
    const move = (e) => {
      if (!drag.active) return;
      const dx = e.clientX - drag.lastX;
      drag.yaw += dx * 0.012;
      drag.velocity = dx * 0.012;
      drag.pitch = THREE.MathUtils.clamp(drag.pitch + (e.clientY - drag.lastY) * 0.006, -0.5, 0.5);
      drag.lastX = e.clientX;
      drag.lastY = e.clientY;
    };
    const up = () => { drag.active = false; };
    element.addEventListener('pointerdown', down);
    element.addEventListener('pointermove', move);
    element.addEventListener('pointerup', up);
    element.addEventListener('pointercancel', up);

    let visible = true;
    const seen = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    seen.observe(element);

    let pop = 1;
    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      if (!visible) return;
      const t = clock.getElapsedTime();
      if (!drag.active) {
        drag.yaw += drag.velocity;
        drag.velocity *= 0.94;
        drag.pitch *= 0.97;
      }
      const sway = reduced ? 0 : Math.sin(t * 0.6) * 0.32;
      const swing = reduced ? 0 : Math.sin(t * 0.9) * 0.018;
      pivot.rotation.set(drag.pitch, drag.yaw + sway, swing);
      pop += (1 - pop) * 0.12;
      mesh.scale.setScalar(pop);
      renderer.render(scene, camera);
    });

    api.current = {
      setModel(next) {
        mesh.geometry.dispose();
        mesh.geometry = buildGeometry(next);
        if (!reduced) pop = 0.975;
      },
      setColor({ id, hex }) {
        material.color.set(hex);
        material.metalness = METALLIC[id] ?? 0;
        material.roughness = METALLIC[id] ? 0.34 : 0.42;
      },
    };

    return () => {
      renderer.setAnimationLoop(null);
      observer.disconnect();
      seen.disconnect();
      mesh.geometry.dispose();
      thread.geometry.dispose();
      material.dispose();
      threadMaterial.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      api.current = null;
    };
  }, []);

  useEffect(() => { if (model) api.current?.setModel(model); }, [model]);
  useEffect(() => { api.current?.setColor(color); }, [color]);

  return <div ref={host} className="stage-canvas" role="img" aria-label="Dreidimensionale Vorschau Ihres Anhängers. Ziehen zum Drehen." />;
}
