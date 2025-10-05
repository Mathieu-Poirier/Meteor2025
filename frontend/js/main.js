import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// controls
const controls = new OrbitControls(camera, renderer.domElement);

const loader = new GLTFLoader();
let earthMesh = null;
let asteroidMesh = null;

// Load Earth
loader.load(
  '/models/earth/earth.gltf',
  (gltf) => {
    earthMesh = gltf.scene;
    scene.add(earthMesh);

    // center and fit in camera view
    const box = new THREE.Box3().setFromObject(earthMesh);
    const size = box.getSize(new THREE.Vector3()).length();
    const center = box.getCenter(new THREE.Vector3());
    earthMesh.position.sub(center);

    const fitDist = size / (2 * Math.tan((camera.fov * Math.PI) / 360));
    camera.position.set(0, 0, fitDist * 1.5);
    camera.near = fitDist / 100;
    camera.far = fitDist * 100;
    camera.updateProjectionMatrix();
  },
  (xhr) => console.log(`Earth ${(xhr.loaded / (xhr.total || 1) * 100).toFixed(1)}%`),
  (err) => console.error('Failed to load Earth:', err)
);

// Function to spawn or update asteroid
async function spawnAsteroid(asteroidId) {
  try {
    // Query backend for asteroid orbit + metadata
    const crossRes = await fetch(
      `http://127.0.0.1:8000/cross_keplarian?asteroid_id=${asteroidId}`
    );
    const crossData = await crossRes.json();

    const { a, e, i, om, w, ma } = crossData.orbit;

    // Query backend for 3D position
    const posRes = await fetch(
      `http://127.0.0.1:8000/asteroid_position?a=${a}&e=${e}&i=${i}&om=${om}&w=${w}&ma=${ma}`
    );
    const pos = await posRes.json();

    // scale factor based on diameter
    const diameterKm =
      (crossData.diameter_km.min + crossData.diameter_km.max) / 2;
    const scale = Math.max(diameterKm / 1000, 0.01); // prevent disappearing

    if (!asteroidMesh) {
      // Load asteroid model
      loader.load(
        '/models/asteroid/asteroid.gltf',
        (gltf) => {
          asteroidMesh = gltf.scene;
          asteroidMesh.scale.set(scale, scale, scale);
          asteroidMesh.position.set(pos.x * 5, pos.y * 5, pos.z * 5); // scaled for visibility
          scene.add(asteroidMesh);
        },
        (xhr) =>
          console.log(
            `Asteroid ${(xhr.loaded / (xhr.total || 1) * 100).toFixed(1)}%`
          ),
        (err) => console.error('Failed to load asteroid:', err)
      );
    } else {
      // Update existing asteroid
      asteroidMesh.scale.set(scale, scale, scale);
      asteroidMesh.position.set(pos.x * 5, pos.y * 5, pos.z * 5);
    }

    // Collision check (distance between asteroid and Earth)
    const dist = Math.sqrt(pos.x ** 2 + pos.y ** 2 + pos.z ** 2);
    if (dist < 1) {
      console.warn('⚠️ Potential collision detected!');
    }
  } catch (err) {
    console.error('Error fetching asteroid data:', err);
  }
}

// Form submit event (fetch asteroid by ID)
document.getElementById('asteroidForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const id = document.getElementById('asteroidId').value.trim();
  if (id) spawnAsteroid(id);
});

// Slider updates
['a', 'e', 'i'].forEach((param) => {
  document
    .getElementById(param + 'Slider')
    .addEventListener('input', async () => {
      if (!asteroidMesh) return;

      const a = parseFloat(document.getElementById('aSlider').value);
      const eVal = parseFloat(document.getElementById('eSlider').value);
      const iVal = parseFloat(document.getElementById('iSlider').value);

      const posRes = await fetch(
        `http://127.0.0.1:8000/asteroid_position?a=${a}&e=${eVal}&i=${iVal}&om=0&w=0&ma=0`
      );
      const pos = await posRes.json();

      asteroidMesh.position.set(pos.x * 5, pos.y * 5, pos.z * 5);
    });
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
