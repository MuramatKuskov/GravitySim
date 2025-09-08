import { renderer, scene, camera, controls } from "../utils/threeSetup.js";
import { requestRenderIfNotRequested } from "../utils/renderUtils.js";
import { useCustomRangeBehavior, handleCelestialBodyInput, openBodyView, updateBodyView } from "../utils/UIUtils.js";
import { getIntersects, resetWorld, attachCameraToBody } from "../utils/worldUtils.js";

let draggingFrame = null;
let dragStartX, dragStartY = 0;

export function initUI() {
	setListeners();
}

function setListeners() {
	listenPlayback();
	listenMouse();
	listenTouches();
}

function listenTouches() {
	window.addEventListener("touchstart", (event) => {
		// drag/resize frames
		if (event.target.classList.contains("drag-resize-container")) {
			event.stopPropagation();
			event.preventDefault();
			draggingFrame = event.target.parentElement;
			dragStartX = event.touches[0].clientX - event.target.parentElement.offsetLeft;
			dragStartY = event.touches[0].clientY - event.target.parentElement.offsetTop;
		} else if (event.target.tagName === "INPUT" && event.target.type === "range") {
			const input = event.target;

			const menu = input.closest(".menu");
			if (!menu) return;

			switch (menu.id) {
				case "celestialBodyView":
					const bodyIndex = parseInt(menu.dataset.bodyIndex);
					const body = scene.getObjectByName("CelestialBodies").children[bodyIndex];
					if (!body) return;

					handleCelestialBodyInput(menu, input, body);
					break;
			}
		}
	});

	window.addEventListener("touchmove", (event) => {
		if (draggingFrame) {
			event.preventDefault();
			draggingFrame.style.left = (event.touches[0].clientX - dragStartX) + "px";
			draggingFrame.style.top = (event.touches[0].clientY - dragStartY) + "px";
			return;
		}
	});

	window.addEventListener("touchend", (event) => {
		draggingFrame = null;
	});

	window.addEventListener("touchcancel", (event) => {
		draggingFrame = null;
	});
}

function listenMouse() {
	window.addEventListener("mousedown", (event) => {
		// drag/resize frames
		if (event.target.classList.contains("drag-resize-container")) {
			event.stopPropagation();
			event.preventDefault();
			draggingFrame = event.target.parentElement;
			dragStartX = event.clientX - event.target.parentElement.offsetLeft;
			dragStartY = event.clientY - event.target.parentElement.offsetTop;
		}

		// continuously apply input range values
		if (event.target.tagName === "INPUT" && event.target.type === "range") {
			const input = event.target;

			const menu = input.closest(".menu");
			if (!menu) return;

			switch (menu.id) {
				case "celestialBodyView":
					const bodyIndex = parseInt(menu.dataset.bodyIndex);
					const body = scene.getObjectByName("CelestialBodies").children[bodyIndex];
					if (!body) return;

					handleCelestialBodyInput(menu, input, body);
					break;
			}
		}
	});
	window.addEventListener("mousemove", handleMouseMove);
	window.addEventListener("mouseup", (event) => {
		draggingFrame = null;

		if (event.target === renderer.domElement) {
			handleCanvasClick(event);
		} else if (event.target.classList.contains("frame__control")) {
			handleFrameControls(event);
		}
	});
}

function handleFrameControls(event) {
	const frame = event.target.closest(".frame");

	switch (event.target.dataset.action) {
		case "close":
			frame.dataset.pinned = "false";
			frame.classList.remove("active");
			break;

		case "pin":
			if (frame.dataset.pinned === "true") {
				frame.dataset.pinned = "false";
			} else {
				frame.dataset.pinned = "true";
			}
	}
}

function listenPlayback() {
	const playButton = document.getElementById("playButton");
	const pauseButton = document.getElementById("pauseButton");
	const stopButton = document.getElementById("stopButton");

	playButton.addEventListener("click", () => {
		scene.userData.animateWorld = true;
		requestRenderIfNotRequested();
	});

	pauseButton.addEventListener("click", () => {
		scene.userData.animateWorld = false;
	});

	stopButton.addEventListener("click", () => {
		// scene.userData.animateWorld = false;
		camera.userData.focusTarget = null;
		camera.position.copy(camera.userData.defaultPosition);
		controls.target.set(0, 0, 0);
		controls.update();
		// do not reset customized params here
		// extract it to a separate UI element
		resetWorld();
		updateBodyView();
		requestRenderIfNotRequested();
	});
}

function closeAllOverlays() {
	const menus = document.getElementById("menus");
	const activeMenus = menus.querySelectorAll(".menu.active");
	activeMenus.forEach((menu) => {
		if (menu.dataset.pinned === "true") return;
		menu.classList.remove("active");
	});
}

function handleCanvasClick(event) {
	closeAllOverlays();

	const intersects = getIntersects(event, scene.children);
	if (!intersects.length) return;

	// pick smallest intersected object
	let target;
	intersects.forEach(({ object }) => {
		if (!object.name.startsWith("BodyContainer_")) return;
		if (!target) {
			target = object;
			return;
		}
	});

	openBodyView(target.parent);
}

function handleMouseMove(event) {
	if (draggingFrame) {
		draggingFrame.style.left = (event.clientX - dragStartX) + "px";
		draggingFrame.style.top = (event.clientY - dragStartY) + "px";
		return;
	}

	// const intersects = getIntersects(event, scene.children);
	// if (!intersects.length > 0) return;

	// const firstIntersect = intersects[0].object;
	// const secondIntersect = intersects[1]?.object;

	// console.warn(secondIntersect?.name, firstIntersect.name);

	// if (!secondIntersect) { }
	// // prioritize interaction with the second object
	// if (secondIntersect?.name.startsWith("BodyContainer_") && firstIntersect.name.startsWith("BodyContainer_")) {

	// }
}