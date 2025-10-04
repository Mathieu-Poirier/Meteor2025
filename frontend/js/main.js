import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
document.addEventListener('DOMContentLoaded', () => {
  const title = document.querySelector('.title-t');
  const sub = document.querySelector('.title-t2');

  title.addEventListener('animationend', () => {
    console.log('First animation done');
    sub.style.animation = 'fadeIn 2s ease-in-out forwards';
  });
});

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

//controls
const controls = new OrbitControls(camera, renderer.domElement)

// Load Earth
const loader = new GLTFLoader();
loader.load(
  '/models/earth/earth.gltf',  
  (gltf) => {
    const earth = gltf.scene;
    scene.add(earth);

    // center and fit in camera view
    const box = new THREE.Box3().setFromObject(earth);
    const size = box.getSize(new THREE.Vector3()).length();
    const center = box.getCenter(new THREE.Vector3());
    earth.position.sub(center);

    const fitDist = size / (2 * Math.tan((camera.fov * Math.PI) / 360));
    camera.position.set(0, 0, fitDist * 1.2);
    camera.near = fitDist / 100;
    camera.far = fitDist * 100;
    camera.updateProjectionMatrix();
  },
  (xhr) => console.log(`Earth ${(xhr.loaded/(xhr.total||1)*100).toFixed(1)}%`),
  (err) => console.error('Failed to load Earth:', err)
);


loader.load('/models/asteroid/asteroid.gltf', (gltf) => {
  const asteroid = gltf.scene;
  scene.add(asteroid);
});


function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
