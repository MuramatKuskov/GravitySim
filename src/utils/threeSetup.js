import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/Addons.js";
import { TextGeometry } from "three/examples/jsm/Addons.js";
import { OrbitControls } from "three/examples/jsm/Addons.js";
import { loadTexture } from "./loadMgmt";

//#region renderer

export const renderer = new THREE.WebGLRenderer({
	antialias: true,
	alpha: true
});
renderer.autoClear = false;
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

// #region axeshelper

export const axesHelperFrame = document.getElementById("axesHelper");
export const axesScene = new THREE.Scene();
axesScene.visible = false;
// background
const axesHelperBackgroundGeometry = new THREE.PlaneGeometry(15, 15);
const axesHelperBackgroundMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0.7, transparent: true });
const axesHelperBackgroundMesh = new THREE.Mesh(axesHelperBackgroundGeometry, axesHelperBackgroundMaterial);
axesHelperBackgroundMesh.name = "AxesHelperBackground";
axesHelperBackgroundMesh.position.set(0, 0, -0.4);
axesScene.add(axesHelperBackgroundMesh);
// axes
const axeshelper = new THREE.AxesHelper(0.6);
axeshelper.name = "AxesHelper";
axeshelper.position.set(0, 0, 0.3);
axesScene.add(axeshelper);
// camera
const fov = 45;
const aspect = 2;
const near = 0.1;
const far = 5;
export const axesCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
axesCamera.position.set(0, 2, 2);
axesCamera.lookAt(0, 0, 0);
// labels
const labelLoader = new FontLoader();
labelLoader.load('assets/fonts/helvetiker_regular.typeface.json', (font) => {
	const textGeoX = new TextGeometry('X', {
		font: font,
		size: 0.1,
		depth: 0.01,
		height: 0.01,
		curveSegments: 12,
		bevelEnabled: false
	});
	const textMaterialX = new THREE.MeshBasicMaterial({ color: 0xff0000 });
	const textMeshX = new THREE.Mesh(textGeoX, textMaterialX);
	textMeshX.position.set(0.7, 0, 0);
	axeshelper.add(textMeshX);

	const textGeoY = new TextGeometry('Y', {
		font: font,
		size: 0.1,
		depth: 0.01,
		height: 0.01,
		curveSegments: 12,
		bevelEnabled: false
	});
	const textMaterialY = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
	const textMeshY = new THREE.Mesh(textGeoY, textMaterialY);
	textMeshY.position.set(0, 0.7, 0);
	axeshelper.add(textMeshY);

	const textGeoZ = new TextGeometry('Z', {
		font: font,
		size: 0.1,
		depth: 0.01,
		height: 0.01,
		curveSegments: 12,
		bevelEnabled: false
	});
	const textMaterialZ = new THREE.MeshBasicMaterial({ color: 0x0000ff });
	const textMeshZ = new THREE.Mesh(textGeoZ, textMaterialZ);
	textMeshZ.position.set(-0.15, 0, 0.7);
	axeshelper.add(textMeshZ);
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