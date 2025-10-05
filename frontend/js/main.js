import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// -------------------- Constants --------------------
const ORBIT_SCALE = 50000;              // exaggerate orbital distances
const EARTH_RADIUS_KM = 6371;
const EARTH_VISUAL_SIZE = 2;            // shrink Earth visually
const MIN_ASTEROID_SCALE = 0.2;         // minimum asteroid size for visibility
const TRAIL_LENGTH = 100;               // number of points to keep for asteroid trail

// -------------------- Scene Setup --------------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  500000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.update();

const loader = new GLTFLoader();
let earthMesh = null;
let asteroidMesh = null;
let orbitTrail = null;
let trailPoints = [];  // stores recent asteroid positions

let currentOrbit = null;
let currentScale = 1.0;
let currentMeanAnomaly = 0;

// -------------------- Helpers --------------------
async function computePosition(a, e, i, om, w, ma) {
  const url = `/asteroid_position?a=${a}&e=${e}&i=${i}&om=${om}&w=${w}&ma=${ma}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`asteroid_position failed: ${res.status}`);
  return await res.json();
}

// -------------------- Earth --------------------
loader.load(
  '/models/earth/earth.gltf',
  (gltf) => {
    earthMesh = gltf.scene;
    earthMesh.scale.set(EARTH_VISUAL_SIZE, EARTH_VISUAL_SIZE, EARTH_VISUAL_SIZE);
    scene.add(earthMesh);

    // Center Earth
    const box = new THREE.Box3().setFromObject(earthMesh);
    const center = box.getCenter(new THREE.Vector3());
    earthMesh.position.sub(center);

    console.log("🌍 Earth loaded.");

    // Auto-fit camera to Earth
    const size = box.getSize(new THREE.Vector3()).length();
    const fitDist = size / (2 * Math.tan((camera.fov * Math.PI) / 360));

    camera.position.set(0, 0, fitDist * 6.0);
    camera.near = fitDist / 100;
    camera.far = fitDist * 20000;
    camera.updateProjectionMatrix();

    controls.update();
  },
  (xhr) => console.log(`Earth loading: ${(xhr.loaded / (xhr.total || 1) * 100).toFixed(1)}%`),
  (err) => console.error('❌ Failed to load Earth model:', err)
);

// -------------------- Asteroid --------------------
async function spawnAsteroid(asteroidId) {
  const crossRes = await fetch(`/cross_keplarian?asteroid_id=${asteroidId}`);
  if (!crossRes.ok) throw new Error(`cross_keplarian failed: ${crossRes.status}`);
  const crossData = await crossRes.json();

  currentOrbit = {
    a: parseFloat(crossData.orbit.a),
    e: parseFloat(crossData.orbit.e),
    i: parseFloat(crossData.orbit.i),
    om: parseFloat(crossData.orbit.om),
    w: parseFloat(crossData.orbit.w),
    ma: parseFloat(crossData.orbit.ma),
  };
  currentMeanAnomaly = currentOrbit.ma;

  const diameterKm = (crossData.diameter_km.min + crossData.diameter_km.max) / 2;
  const scaleFactor = (diameterKm / EARTH_RADIUS_KM) * EARTH_VISUAL_SIZE * 200;
  currentScale = Math.max(scaleFactor, MIN_ASTEROID_SCALE);

  console.log(`🪐 Asteroid ${crossData.name}`);
  console.log(`   Diameter ~ ${diameterKm.toFixed(2)} km`);
  console.log(`   Model scale applied: ${currentScale}`);

  const pos = await computePosition(
    currentOrbit.a,
    currentOrbit.e,
    currentOrbit.i,
    currentOrbit.om,
    currentOrbit.w,
    currentMeanAnomaly
  );

  if (!asteroidMesh) {
    loader.load('/models/asteroid/asteroid.gltf', (gltf) => {
      asteroidMesh = gltf.scene;
      asteroidMesh.scale.set(currentScale, currentScale, currentScale);
      asteroidMesh.position.set(pos.x * ORBIT_SCALE, pos.y * ORBIT_SCALE, pos.z * ORBIT_SCALE);

      // ⭐ Debug red sphere inside asteroid
      const debugSphere = new THREE.Mesh(
        new THREE.SphereGeometry(500, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
      );
      asteroidMesh.add(debugSphere);

      scene.add(asteroidMesh);
      console.log("✅ Asteroid mesh created.");
    });
  } else {
    asteroidMesh.scale.set(currentScale, currentScale, currentScale);
    asteroidMesh.position.set(pos.x * ORBIT_SCALE, pos.y * ORBIT_SCALE, pos.z * ORBIT_SCALE);
  }

  // Reset trail
  trailPoints = [];
  if (orbitTrail) {
    scene.remove(orbitTrail);
    orbitTrail.geometry.dispose();
  }
}

window.addEventListener("DOMContentLoaded", () => {
  ["aSlider", "eSlider", "iSlider"].forEach(id => {
    document.getElementById(id).addEventListener("input", updateOrbitFromSliders);
  });
});

// -------------------- Trail --------------------
function updateTrail(position) {
  trailPoints.push(position.clone());
  if (trailPoints.length > TRAIL_LENGTH) {
    trailPoints.shift();
  }

  if (orbitTrail) {
    scene.remove(orbitTrail);
    orbitTrail.geometry.dispose();
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(trailPoints);
  const material = new THREE.LineBasicMaterial({ color: 0xffff00 });
  orbitTrail = new THREE.Line(geometry, material);
  scene.add(orbitTrail);
}

// -------------------- UI --------------------
document.getElementById('asteroidForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('asteroidId').value.trim();
  if (id) spawnAsteroid(id);
});

// -------------------- Slider Controls --------------------
function updateOrbitFromSliders() {
  if (!currentOrbit || !asteroidMesh) return;

  currentOrbit.a = parseFloat(document.getElementById("aSlider").value);
  currentOrbit.e = parseFloat(document.getElementById("eSlider").value);
  currentOrbit.i = parseFloat(document.getElementById("iSlider").value);

  document.getElementById("aValue").textContent = currentOrbit.a.toFixed(2);
  document.getElementById("eValue").textContent = currentOrbit.e.toFixed(2);
  document.getElementById("iValue").textContent = currentOrbit.i.toFixed(0);

  // recompute asteroid position
  computePosition(
    currentOrbit.a, currentOrbit.e, currentOrbit.i,
    currentOrbit.om, currentOrbit.w, currentMeanAnomaly
  ).then((pos) => {
    const newPos = new THREE.Vector3(
      pos.x * ORBIT_SCALE,
      pos.y * ORBIT_SCALE,
      pos.z * ORBIT_SCALE
    );
    asteroidMesh.position.copy(newPos);
    updateTrail(newPos);
  });
}


// -------------------- Animate --------------------
function animate() {
  requestAnimationFrame(animate);

  if (asteroidMesh && currentOrbit) {
    currentMeanAnomaly += 0.5;
    if (currentMeanAnomaly > 360) currentMeanAnomaly -= 360;
    computePosition(
      currentOrbit.a,
      currentOrbit.e,
      currentOrbit.i,
      currentOrbit.om,
      currentOrbit.w,
      currentMeanAnomaly
    ).then((pos) => {
      const newPos = new THREE.Vector3(
        pos.x * ORBIT_SCALE,
        pos.y * ORBIT_SCALE,
        pos.z * ORBIT_SCALE
      );
      asteroidMesh.position.copy(newPos);
      updateTrail(newPos);
    });
  }

  controls.update();
  renderer.render(scene, camera);
}
animate();
