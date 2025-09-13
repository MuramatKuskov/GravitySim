import * as THREE from "three";
import { scene, camera, controls } from "./threeSetup.js";

const raycaster = new THREE.Raycaster();

export const G = 0.000000005;

const pinStar = false;

let drawContainers = false;
const containerRescaleGap = 100;
const containerDistanceScaleFactor = 0.027;
const containerMinScale = 1.2;
const containerMaxScale = 100.0;

export function calculateGravitationalForce(mass1, mass2, distance) {
	return G * (mass1 * mass2) / (distance * distance);
}

export function applyGravitationalVelocity(target, otherBodies) {
	if (pinStar && target.userData.category === "star") return;

	otherBodies.forEach((body) => {
		if (body === target) return;
		const directionToOther = new THREE.Vector3().subVectors(
			body.position,
			target.position
		).normalize();
		const distanceToOther = target.position.distanceTo(body.position);
		const gravitationalForceMagnitude = calculateGravitationalForce(target.userData.current.weightedMass, body.userData.current.weightedMass, distanceToOther);
		const gravitationalForce = directionToOther.multiplyScalar(gravitationalForceMagnitude);
		target.userData.current.velocity.add(gravitationalForce);
	});

	target.position.add(target.userData.current.velocity);
}

export function getIntersects(event, objects) {
	const mouse = new THREE.Vector2();
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
	raycaster.setFromCamera(mouse, camera);
	const intersects = raycaster.intersectObjects(objects, true);
	return intersects.filter(({ object }) => object.type !== "Points" && !object.name.startsWith("Body_"));
}

export function resetWorld() {
	resetBodies();
	resetTrails();
}

function resetTrails() {
	const trailGroup = scene.getObjectByName("TrailGroup");
	if (!trailGroup) return;

	while (trailGroup.children.length > 0) {
		const trailMesh = trailGroup.children[0];
		trailGroup.remove(trailMesh);
		trailMesh.geometry.dispose();
		trailMesh.material.dispose();
	}
}

function resetBodies() {
	const celestialBodies = scene.getObjectByName("CelestialBodies");
	if (celestialBodies) {
		celestialBodies.children.forEach((body) => {
			body.position.copy(body.userData.default.position);
			body.userData.current.weightedMass = body.userData.default.weightedMass;
			body.userData.current.velocity.copy(body.userData.default.velocity);
			body.userData.current.trailLength = 0;

			const mesh = body.getObjectByName(`bodyMesh_${body.userData.index}`);
			mesh.userData.current.trailLifespan = 0;

			const velocityVector = body.getObjectByName(`velocityVector_${body.userData.index}`);
			if (!velocityVector || !velocityVector.visible) return;

			const dir = body.userData.current.velocity.clone().normalize();
			const length = body.userData.current.velocity.length() * 100;
			velocityVector.setDirection(dir);
			velocityVector.setLength(length);
		});
	}
}

export function attachCameraToBody(body) {
	if (camera.userData.focusTarget === body) return;

	camera.userData.focusTarget = body;
	camera.userData.offset = new THREE.Vector3(0, 0, 10);
	camera.position.copy(body.position).add(camera.userData.offset);
	controls.target.copy(body.position);
	controls.update();
}

export function detachCamera() {
	camera.userData.focusTarget = null;
	camera.position.copy(camera.userData.defaultPosition);
	controls.target.set(0, 0, 0);
	controls.update();
}

export function updateContainerScales() {
	const celestialBodies = scene.getObjectByName("CelestialBodies");
	if (!celestialBodies) return;

	celestialBodies.children.forEach((body) => {
		const container = body.getObjectByName(`BodyContainer_${body.name.split("_")[1]}`);
		container.visible = drawContainers;
		const distanceToCamera = camera.position.distanceTo(body.position);

		if (!container) return;

		const difference = distanceToCamera - container.userData.lastRescaleDistance;
		if (Math.abs(difference) < containerRescaleGap) return;

		container.userData.lastRescaleDistance = distanceToCamera;
		container.scale.setScalar(THREE.MathUtils.clamp(distanceToCamera * containerDistanceScaleFactor / body.userData.current.scale, containerMinScale, containerMaxScale));
	});
}

export function updateVelocityVector(body) {
	const arrowHelper = body.getObjectByName(`velocityVector_${body.userData.index}`);
	if (!arrowHelper || !arrowHelper.visible) return;

	const dir = body.userData.current.velocity.clone().normalize();
	// const length = body.userData.current.velocity.length() * 150;
	const length = Math.max(0.5, Math.min(body.userData.current.velocity.length() * 50, 50));
	arrowHelper.setDirection(dir);
	arrowHelper.setLength(length);
}