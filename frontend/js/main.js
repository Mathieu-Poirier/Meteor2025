import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FlyControls } from 'three/addons/controls/FlyControls.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let earth = null;
let asteroid = null;
let flying = false;              

// --- scene / camera / renderer ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 1000);

// free camera starting pose 
camera.position.set(10, 5, 12);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

/* controls (free orbit/pan/zoom)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
*/

//free look
const controls = new FlyControls(camera, renderer.domElement);
controls.movementSpeed = 10;     // how fast you move
controls.rollSpeed = Math.PI / 24; // how fast you turn with Q/E
controls.autoForward = false; 
controls.dragToLook = true;     // click+drag to look around


// simple light so models aren’t black
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(5, 6, 4);
scene.add(sun);

// --- load models ---
const loader = new GLTFLoader();

// Earth
loader.load('/models/earth/earth.gltf', (gltf) => {
  earth = gltf.scene;
  scene.add(earth);

  const box = new THREE.Box3().setFromObject(earth);
  const center = box.getCenter(new THREE.Vector3());
  earth.position.sub(center);
  //creation of sphere for walls
   const sphere = new THREE.Sphere();
  box.getBoundingSphere(sphere);
  earth.scale.setScalar(0.001);

});

// Asteroid
loader.load('/models/asteroid/asteroid.gltf', (gltf) => {
  asteroid = gltf.scene;
  asteroid.scale.setScalar(0.02);   
  asteroid.position.set(-30, 0, 0); 
  scene.add(asteroid);
});

//launch button
const launchBtn = document.getElementById('launch');
launchBtn?.addEventListener('click', () => {
  if (!asteroid || !earth) return;
  flying = true;
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  controls.update(delta);  

  // asteroid logic
  if (flying && asteroid) {
    asteroid.position.x += 0.55;
    if (asteroid.position.x >= 0) {
      flying = false;
      console.log('Impact!');
    }
  }

  renderer.render(scene, camera);
}
animate();



