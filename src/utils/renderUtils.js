import * as THREE from 'three';
import { renderer, scene, axesScene, axesHelperFrame, axesCamera, camera, controls } from "./threeSetup.js";
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

	// move camera with focus target
	if (camera.userData.focusTarget) {
		camera.position.copy(camera.userData.focusTarget.position).add(camera.userData.offset);
		controls.target.copy(camera.userData.focusTarget.position);
		camera.lookAt(camera.userData.focusTarget.position);
	}

	// update controls for damping
	controls.update();

	renderer.render(scene, camera);
	renderAxesHelper();
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

export function renderAxesHelper() {
	const { left, right, top, bottom, width, height } =
		axesHelperFrame.getBoundingClientRect();

	axesCamera.aspect = width / height;
	axesCamera.updateProjectionMatrix();

	const viewport = renderer.getViewport(new THREE.Vector4());

	const positiveYUpBottom = renderer.domElement.clientHeight - bottom;
	renderer.setViewport(left, positiveYUpBottom, width, height);
	renderer.setScissor(left, positiveYUpBottom, width, height);
	renderer.setScissorTest(true);

	const axesHelper = axesScene.getObjectByName("AxesHelper");
	axesHelper.children.forEach((child) => {
		child.lookAt(axesCamera.position);
	});

	renderer.render(axesScene, axesCamera);

	renderer.setScissorTest(false);
	renderer.setViewport(viewport);
}

function handleControlsChange() {
	const axesHelper = axesScene.getObjectByName("AxesHelper");
	axesHelper.quaternion.copy(camera.quaternion).invert();

	requestRenderIfNotRequested();
}

controls.addEventListener('change', handleControlsChange);
window.addEventListener('resize', requestRenderIfNotRequested);