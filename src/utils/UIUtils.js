import { drawTrail } from "../modules/world.js";
import { requestRenderIfNotRequested } from "./renderUtils.js";
import { scene } from "./threeSetup.js";
import { attachCameraToBody } from "./worldUtils.js";

let rangeInputInterval = null;

export function useCustomRangeBehavior(input, label, halfRange, incrementFunction, decrementFunction) {
	let impactedLabel;

	if ("multipleValues" in label.dataset) {
		impactedLabel = label.querySelector(`#posLabel${input.dataset.targetEntry} .parameter-value`) ||
			label.querySelector(`#velLabel${input.dataset.targetEntry} .parameter-value`);
	} else {
		impactedLabel = label;
	}

	rangeInputInterval = setInterval(() => {
		let targetParameter;
		if (input.value < halfRange) {
			targetParameter = decrementFunction(Math.abs(input.value - halfRange));
		} else {
			targetParameter = incrementFunction(Math.abs(input.value - halfRange));
		}

		// draw trail on pos change
		if (label.id === "celestialBodyPositionLabel") {
			const bodyIndex = parseInt(input.closest(".menu").dataset.bodyIndex);
			const body = scene.getObjectByName("CelestialBodies").children[bodyIndex];
			drawTrail(body.getObjectByName(`bodyMesh_${bodyIndex}`));
		}

		requestRenderIfNotRequested();

		// update label
		const isIncrement = input.value >= halfRange;
		if (isIncrement) {
			impactedLabel.classList.add("increment");
			impactedLabel.classList.remove("decrement");
		} else {
			impactedLabel.classList.add("decrement");
			impactedLabel.classList.remove("increment");
		}
		impactedLabel.textContent = targetParameter;

		if ("multipleValues" in label.dataset) {
			impactedLabel.textContent = targetParameter.toFixed(2);
		} else {
			impactedLabel.textContent = targetParameter;
		}
	}, 50);

	function abortContinuousInput() {
		if (rangeInputInterval) {
			clearInterval(rangeInputInterval);
			rangeInputInterval = null;
			input.value = halfRange;
			impactedLabel.classList.remove("increment", "decrement");
		}
	}

	window.addEventListener("mouseup", abortContinuousInput, { once: true });
	window.addEventListener("touchend", abortContinuousInput, { once: true });
	window.addEventListener("touchcancel", abortContinuousInput, { once: true });
}

export function handleCelestialBodyInput(menu, input, body) {
	const halfRange = parseFloat(input.max) / 2;
	const posLabel = menu.querySelector("#celestialBodyPositionLabel");
	const velLabel = menu.querySelector("#celestialBodyVelocityLabel");

	let getValue, setValue;

	switch (input.id) {
		case "celestialBodyMass":
			const massLabel = menu.querySelector("#celestialBodyMassLabel");
			getValue = () => body.userData.current.weightedMass;
			setValue = (value) => body.userData.current.weightedMass = value;
			const incrementMass = (val) => setValue(body.userData.current.weightedMass + val);
			const decrementMass = (val) => setValue(body.userData.current.weightedMass - val);
			useCustomRangeBehavior(input, massLabel, halfRange, incrementMass, decrementMass);
			break;

		case "posX":
			getValue = () => body.position.x;
			setValue = (value) => body.position.x = value;
			const incrementX = (val) => setValue(body.position.x + val);
			const decrementX = (val) => setValue(body.position.x - val);
			useCustomRangeBehavior(input, posLabel, halfRange, incrementX, decrementX);
			break;

		case "posY":
			getValue = () => body.position.y;
			setValue = (value) => body.position.y = value;
			const incrementY = (val) => setValue(body.position.y + val);
			const decrementY = (val) => setValue(body.position.y - val);
			useCustomRangeBehavior(input, posLabel, halfRange, incrementY, decrementY);
			break;

		case "posZ":
			getValue = () => body.position.z;
			setValue = (value) => body.position.z = value;
			const incrementZ = (val) => setValue(body.position.z + val);
			const decrementZ = (val) => setValue(body.position.z - val);
			useCustomRangeBehavior(input, posLabel, halfRange, incrementZ, decrementZ);
			break;

		case "velX":
			getValue = () => body.userData.current.velocity.x;
			setValue = (value) => body.userData.current.velocity.x = value;
			const incrementVelX = (val) => setValue(body.userData.current.velocity.x + val);
			const decrementVelX = (val) => setValue(body.userData.current.velocity.x - val);
			useCustomRangeBehavior(input, velLabel, halfRange, incrementVelX, decrementVelX);
			break;

		case "velY":
			getValue = () => body.userData.current.velocity.y;
			setValue = (value) => body.userData.current.velocity.y = value;
			const incrementVelY = (val) => setValue(body.userData.current.velocity.y + val);
			const decrementVelY = (val) => setValue(body.userData.current.velocity.y - val);
			useCustomRangeBehavior(input, velLabel, halfRange, incrementVelY, decrementVelY);
			break;

		case "velZ":
			getValue = () => body.userData.current.velocity.z;
			setValue = (value) => body.userData.current.velocity.z = value;
			const incrementVelZ = (val) => setValue(body.userData.current.velocity.z + val);
			const decrementVelZ = (val) => setValue(body.userData.current.velocity.z - val);
			useCustomRangeBehavior(input, velLabel, halfRange, incrementVelZ, decrementVelZ);
			break;
	}
}

export function updateBodyView() {
	const viewFrame = document.getElementById("celestialBodyView");
	const bodyIndex = parseInt(viewFrame.dataset.bodyIndex);
	const body = scene.getObjectByName("CelestialBodies").children[bodyIndex];
	if (!body) return;

	const bodyType = viewFrame.querySelector("#celestialBodyType select");
	const massLabel = viewFrame.querySelector("#celestialBodyMassLabel");
	const positionDisplay = viewFrame.querySelector("#celestialBodyPosition");
	const velocityDisplay = viewFrame.querySelector("#celestialBodyVelocity");

	// if current vel > prev vel,
	// add "increment", if <, add "decrement"
	// else remove both
	// do the same for position changes

	bodyType.value = body.userData.category || "unknown";
	massLabel.textContent = body.userData.current.weightedMass;

	// update position and velocity displays
	const posXDisplay = positionDisplay.querySelector("#posLabelX .parameter-value");
	const posYDisplay = positionDisplay.querySelector("#posLabelY .parameter-value");
	const posZDisplay = positionDisplay.querySelector("#posLabelZ .parameter-value");
	const velXDisplay = velocityDisplay.querySelector("#velLabelX .parameter-value");
	const velYDisplay = velocityDisplay.querySelector("#velLabelY .parameter-value");
	const velZDisplay = velocityDisplay.querySelector("#velLabelZ .parameter-value");

	const oldX = parseFloat(posXDisplay.textContent);
	const oldY = parseFloat(posYDisplay.textContent);
	const oldZ = parseFloat(posZDisplay.textContent);
	const oldVelX = parseFloat(velXDisplay.textContent);
	const oldVelY = parseFloat(velYDisplay.textContent);
	const oldVelZ = parseFloat(velZDisplay.textContent);

	posXDisplay.textContent = body.position.x.toFixed(2);
	posYDisplay.textContent = body.position.y.toFixed(2);
	posZDisplay.textContent = body.position.z.toFixed(2);
	velXDisplay.textContent = body.userData.current.velocity.x.toFixed(2);
	velYDisplay.textContent = body.userData.current.velocity.y.toFixed(2);
	velZDisplay.textContent = body.userData.current.velocity.z.toFixed(2);

	if (!scene.userData.animateWorld) {
		posXDisplay.classList.remove("increment", "decrement");
		posYDisplay.classList.remove("increment", "decrement");
		posZDisplay.classList.remove("increment", "decrement");
		velXDisplay.classList.remove("increment", "decrement");
		velYDisplay.classList.remove("increment", "decrement");
		velZDisplay.classList.remove("increment", "decrement");
		return;
	}

	if (body.position.x > oldX) {
		posXDisplay.classList.add("increment");
		posXDisplay.classList.remove("decrement");
	} else if (body.position.x < oldX) {
		posXDisplay.classList.add("decrement");
		posXDisplay.classList.remove("increment");
	} else {
		posXDisplay.classList.remove("increment", "decrement");
	}

	if (body.position.y > oldY) {
		posYDisplay.classList.add("increment");
		posYDisplay.classList.remove("decrement");
	} else if (body.position.y < oldY) {
		posYDisplay.classList.add("decrement");
		posYDisplay.classList.remove("increment");
	} else {
		posYDisplay.classList.remove("increment", "decrement");
	}

	if (body.position.z > oldZ) {
		posZDisplay.classList.add("increment");
		posZDisplay.classList.remove("decrement");
	} else if (body.position.z < oldZ) {
		posZDisplay.classList.add("decrement");
		posZDisplay.classList.remove("increment");
	} else {
		posZDisplay.classList.remove("increment", "decrement");
	}

	if (body.userData.current.velocity.x > oldVelX) {
		velXDisplay.classList.add("increment");
		velXDisplay.classList.remove("decrement");
	} else if (body.userData.current.velocity.x < oldVelX) {
		velXDisplay.classList.add("decrement");
		velXDisplay.classList.remove("increment");
	} else {
		velXDisplay.classList.remove("increment", "decrement");
	}

	if (body.userData.current.velocity.y > oldVelY) {
		velYDisplay.classList.add("increment");
		velYDisplay.classList.remove("decrement");
	} else if (body.userData.current.velocity.y < oldVelY) {
		velYDisplay.classList.add("decrement");
		velYDisplay.classList.remove("increment");
	} else {
		velYDisplay.classList.remove("increment", "decrement");
	}

	if (body.userData.current.velocity.z > oldVelZ) {
		velZDisplay.classList.add("increment");
		velZDisplay.classList.remove("decrement");
	} else if (body.userData.current.velocity.z < oldVelZ) {
		velZDisplay.classList.add("decrement");
		velZDisplay.classList.remove("increment");
	} else {
		velZDisplay.classList.remove("increment", "decrement");
	}
}

export function openBodyView(body) {
	const viewFrame = document.getElementById("celestialBodyView");
	viewFrame.classList.add("active");
	viewFrame.dataset.bodyIndex = body.userData.index;

	updateBodyView();
	attachCameraToBody(body);
}