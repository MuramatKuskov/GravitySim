import * as THREE from "three";
import { scene, camera } from "../utils/threeSetup.js";
import { celestialBodyData } from "../data/celestialBodyData.js";
import { applyGravitationalVelocity, updateContainerScales, updateVelocityVector } from "../utils/worldUtils.js";
import { updateBodyView } from "../utils/UIUtils.js";

let trailDistanceFactor = 2;
// let trailDistanceFactor = 112;
// let trailDistanceFactor = 15;
// let trailMultiplier = 125;
let trailMultiplier = 425;

const celestialGeometry = new THREE.SphereGeometry(1, 64, 64);
const trailGeometry = new THREE.CircleGeometry(0.05, 10);
const trailMaterial = new THREE.PointsMaterial({ color: 0x006faa, opacity: 1.0, transparent: true, size: 0.1, sizeAttenuation: true });

export async function initWorld() {
	try {
		const trailGroup = new THREE.Group();
		trailGroup.name = "TrailGroup";
		scene.add(trailGroup);
		// markSceneCenter();
		await createCelestialBodies();
	} catch (error) {
		console.error('Error initializing world:', error);
	}
};

function markSceneCenter() {
	const centerGeometry = new THREE.SphereGeometry(0.5, 16, 16);
	const centerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
	const centerMesh = new THREE.Mesh(centerGeometry, centerMaterial);
	centerMesh.position.set(0, 0, 0);
	scene.add(centerMesh);
}

async function createCelestialBodies() {
	const celestialBodies = new THREE.Group();
	celestialBodies.name = "CelestialBodies";
	scene.add(celestialBodies);

	for (let i = 0; i < celestialBodyData.size; i++) {
		createBody(i, celestialBodies);
	}
	updateContainerScales();
}

function createBody(i, celestialBodies) {
	const bodyData = celestialBodyData.get(i.toString());
	const body = new THREE.Group();
	body.name = bodyData.category + '_' + i;
	body.position.copy(bodyData.position);
	body.scale.setScalar(bodyData.size);
	body.userData = {
		index: i,
		category: bodyData.category,
		default: {
			position: bodyData.position.clone(),
			velocity: bodyData.velocity.clone(),
			weightedMass: bodyData.weightedMass,
			scale: bodyData.size,
		},
		current: {
			velocity: bodyData.velocity.clone(),
			weightedMass: bodyData.weightedMass,
			scale: bodyData.size,
		},
	};
	createBodyMesh(body, bodyData);
	createBodyContainer(body);
	createVelocityVector(body);
	celestialBodies.add(body);
}

function createVelocityVector(body) {
	const dir = body.userData.current.velocity.clone().normalize();
	// const length = body.userData.current.velocity.length() * 150;
	const length = Math.max(0.5, Math.min(body.userData.current.velocity.length() * 50, 50));
	const hex = 0x0faa70;

	const arrowHelper = new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), length, hex, 0.5, 0.25);
	arrowHelper.name = `velocityVector_${body.userData.index}`;
	arrowHelper.visible = true;
	body.add(arrowHelper);
}

function createBodyMesh(body, bodyData) {
	let bodyMaterial;

	// different material for stars & other bodies
	if (bodyData.category === 'star') {
		const light = new THREE.PointLight(0xff115f, 5000);
		body.add(light);

		bodyMaterial = new THREE.MeshPhysicalMaterial({
			map: bodyData.map,
			normalMap: bodyData.normalMap,
			color: 0x9f5f5f,
			emissive: 0xff115f,
			emissiveIntensity: 5,
			emissiveMap: bodyData.map,
		})
	} else {
		bodyMaterial = new THREE.MeshPhysicalMaterial({
			map: bodyData.map,
			normalMap: bodyData.normalMap,
			clearcoat: 1.0,
			clearcoatRoughness: 0.6,
		})
	}

	const bodyMesh = new THREE.Mesh(celestialGeometry.clone(), bodyMaterial);
	bodyMesh.name = `bodyMesh_${body.userData.index}`;
	bodyMesh.userData = {
		default: {
			size: bodyData.size,
			rotation: bodyData.rotation.clone(),
		},
		current: {
			size: bodyData.size,
			rotation: bodyData.rotation.clone(),
			trailLifespan: 0,
		}
	};

	body.add(bodyMesh);
}

function createBodyContainer(body) {
	const containerMaterial = new THREE.MeshBasicMaterial({ color: 0x11ffaf, wireframe: true, opacity: 0.1, transparent: true });
	const container = new THREE.Mesh(celestialGeometry.clone(), containerMaterial);
	container.name = `BodyContainer_${body.name.split("_")[1]}`;
	body.add(container);
}

export function updateWorld(deltaTime, reqRender) {
	const celestialBodies = scene.getObjectByName("CelestialBodies");
	const trailGroup = scene.getObjectByName("TrailGroup");

	if (celestialBodies) {
		celestialBodies.children.forEach((body) => {
			const bodyMesh = body.getObjectByProperty("type", "Mesh");

			applyGravitationalVelocity(body, celestialBodies.children);

			bodyMesh.rotation.x += bodyMesh.userData.current.rotation.x * deltaTime;
			bodyMesh.rotation.y += bodyMesh.userData.current.rotation.y * deltaTime;
			bodyMesh.rotation.z += bodyMesh.userData.current.rotation.z * deltaTime;

			// calc distance to the calculated center of mass
			// mb pass this to drawTrail()?
			const distanceToCenter = body.position.distanceTo(new THREE.Vector3(0, 0, 0));

			const velocity = body.userData.current.velocity;
			const combinedVelocity = velocity.x + velocity.y + velocity.z;
			const velocityMagnitude = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);

			// const calculatedTrailLength = (distanceToCenter * trailDistanceFactor) * trailMultiplier;
			const calculatedTrailLength = (distanceToCenter ** trailDistanceFactor) * trailMultiplier;


			// distance * distanceFactor * velocityFactor
			// const calculatedTrailLength = (distanceToCenter ** trailDistanceFactor) * combinedVelocity * 1000;
			// const calculatedTrailLength = (Math.log2(distanceToCenter) * trailDistanceFactor) * trailMultiplier;

			bodyMesh.userData.current.trailLifespan = Math.max(Math.min(calculatedTrailLength, 20000), 1000);

			updateVelocityVector(body);
			drawTrail(bodyMesh);
		});
		updateBodyView();
		updateContainerScales();
	}

	if (trailGroup) handleTrails(trailGroup);

	reqRender();
}

function handleTrails(trailGroup) {
	trailGroup.children.forEach((trailMesh) => {
		// rotate to face camera
		// trailMesh.lookAt(camera.position);
		const age = performance.now() - trailMesh.userData.born;
		if (age > trailMesh.userData.lifespan) {
			trailGroup.remove(trailMesh);
			trailMesh.geometry.dispose();
			trailMesh.material.dispose();
		} else if (age > trailMesh.userData.fadeStartDistance) {
			const fadeProgress = (age - trailMesh.userData.fadeStartDistance) / (trailMesh.userData.lifespan - trailMesh.userData.fadeStartDistance);
			trailMesh.material.opacity = Math.max(1.0 - fadeProgress, 0);
		}
	});
}

export function drawTrail(bodyMesh) {
	const trailLifespan = bodyMesh.userData.current.trailLifespan;
	const trailGroup = scene.getObjectByName("TrailGroup");
	const trailMesh = new THREE.Points(trailGeometry.clone(), trailMaterial.clone());

	trailMesh.position.copy(bodyMesh.parent.position);
	trailMesh.userData = {
		born: performance.now(),
		lifespan: trailLifespan,
		fadeStartDistance: trailLifespan * 0.7,
	};
	// mv material color to userData & apply for each type
	if (bodyMesh.parent.userData.category === 'star') {
		trailMesh.material.color.set(0xff313f);
		trailMesh.material.size = 0.2;
	}
	trailGroup.add(trailMesh);
}