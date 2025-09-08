import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { loadTexture } from "./loadMgmt";

//#region renderer

export const renderer = new THREE.WebGLRenderer({
	antialias: true,
	alpha: true
});
renderer.autoClear = false;
// renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

//#endregion

//#region scene, camera, light, controls

export const scene = new THREE.Scene();
scene.userData.animateWorld = false;
export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
camera.position.z = 105;
camera.userData.defaultPosition = camera.position.clone();

const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
scene.add(ambientLight);

export const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = true;
controls.panSpeed = 1.0;
controls.minDistance = 10;
controls.maxDistance = 5000;
controls.target.set(0, 0, 0);
controls.update();

// update offset when focused on a body
controls.addEventListener('change', () => {
	if (camera.userData.focusTarget) {
		camera.userData.offset = new THREE.Vector3().subVectors(camera.position, camera.userData.focusTarget.position);
	}
});

//#endregion

//#region skybox
loadTexture('./textures/space.jpg')
	.then((texture) => {
		texture.mapping = THREE.EquirectangularReflectionMapping;
		texture.colorSpace = THREE.SRGBColorSpace;
		scene.background = texture;
	})
	.catch((error) => {
		console.error('Failed to load skybox:', error);
	});

//#endregion