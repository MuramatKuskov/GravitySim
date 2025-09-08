import * as THREE from 'three';
import { renderer, scene, camera, controls } from "./threeSetup.js";
import { updateWorld } from "../modules/world.js";
import { updateContainerScales } from './worldUtils.js';

const clock = new THREE.Clock();
let renderRequested = false;

export function render(startTime) {
	renderRequested = false;
	resizeRendererToDisplaySize();

	if (scene.userData.animateWorld) {
		updateWorld(clock.getDelta(), requestRenderIfNotRequested);
	} else {
		updateContainerScales();
	}

	if (camera.userData.focusTarget) {
		camera.position.copy(camera.userData.focusTarget.position).add(camera.userData.offset);
		controls.target.copy(camera.userData.focusTarget.position);
		camera.lookAt(camera.userData.focusTarget.position);
	}

	// update controls for damping
	controls.update();
	renderer.render(scene, camera);
}

export function resizeRendererToDisplaySize() {
	const canvas = renderer.domElement;
	const width = canvas.clientWidth;
	const height = canvas.clientHeight;
	const needResize = canvas.width !== width || canvas.height !== height;
	if (!needResize) return;

	renderer.setSize(width, height, false);
	camera.aspect = width / height;
	camera.updateProjectionMatrix();
}

export function requestRenderIfNotRequested() {
	if (!renderRequested) {
		renderRequested = true;
		requestAnimationFrame(render);
	}
}

controls.addEventListener('change', requestRenderIfNotRequested);
window.addEventListener('resize', requestRenderIfNotRequested);