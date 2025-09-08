import { drawTrail } from "../modules/world.js";
import { requestRenderIfNotRequested } from "./renderUtils.js";
import { scene } from "./threeSetup.js";
import { attachCameraToBody } from "./worldUtils.js";

let rangeInputInterval = null;

export function useCustomRangeBehavior(input, label, halfRange, incrementFunction, decrementFunction) {
	rangeInputInterval = setInterval(() => {
		let targetParameter;
		if (input.value < halfRange) {
			targetParameter = decrementFunction(Math.abs(input.value - halfRange));
		} else {
			targetParameter = incrementFunction(Math.abs(input.value - halfRange));
		}

		// special case for position change - draw trail
		if (label.id === "celestialBodyPositionLabel") {
			const bodyIndex = parseInt(input.closest(".menu").dataset.bodyIndex);
			const body = scene.getObjectByName("CelestialBodies").children[bodyIndex];
			drawTrail(body.getObjectByName(`bodyMesh_${bodyIndex}`));
		}

		requestRenderIfNotRequested();

		// update label
		if ("multipleValues" in label.dataset) {
			const currentEntries = label.textContent.split("; ");

			switch (input.dataset.targetEntry) {
				case "X":
					currentEntries[0] = `X: ${targetParameter.toFixed(2)}`;
					break;
				case "Y":
					currentEntries[1] = `Y: ${targetParameter.toFixed(2)}`;
					break;
				case "Z":
					currentEntries[2] = `Z: ${targetParameter.toFixed(2)}`;
					break;
			}
			label.textContent = currentEntries.join("; ");
		} else {
			label.textContent = targetParameter;
		}
	}, 50);

	function abortContinuousInput() {
		if (rangeInputInterval) {
			clearInterval(rangeInputInterval);
			rangeInputInterval = null;
			input.value = halfRange;
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

	bodyType.value = body.userData.category || "unknown";
	massLabel.textContent = body.userData.current.weightedMass;
	positionDisplay.querySelector("#celestialBodyPositionLabel").textContent =
		`X: ${body.position.x.toFixed(2)}; Y: ${body.position.y.toFixed(2)}; Z: ${body.position.z.toFixed(2)};`;
	velocityDisplay.querySelector("#celestialBodyVelocityLabel").textContent =
		`X: ${body.userData.current.velocity.x.toFixed(2)}; Y: ${body.userData.current.velocity.y.toFixed(2)}; Z: ${body.userData.current.velocity.z.toFixed(2)};`;
}

export function openBodyView(body) {
	const viewFrame = document.getElementById("celestialBodyView");
	viewFrame.classList.add("active");
	viewFrame.dataset.bodyIndex = body.userData.index;

	updateBodyView();
	attachCameraToBody(body);
}