import { renderer, scene, axesScene, camera, controls } from "../utils/threeSetup.js";
import { requestRenderIfNotRequested } from "../utils/renderUtils.js";
import { handleCelestialBodyInput, openBodyView, updateBodyView } from "../utils/UIUtils.js";
import { attachCameraToBody, detachCamera, getIntersects, resetWorld } from "../utils/worldUtils.js";

let draggingFrame = null;
let resizingFrame = null;
let dragStartX, dragStartY = 0;
let touchedBody = null;

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
			const rect = event.target.getBoundingClientRect();
			const touchX = event.touches[0].clientX - rect.left;
			const touchY = event.touches[0].clientY - rect.top;
			const cornerSize = 20;

			if (touchX > rect.width - cornerSize && touchY > rect.height - cornerSize) {
				resizingFrame = event.target.parentElement;
				dragStartX = event.touches[0].clientX;
				dragStartY = event.touches[0].clientY;
			} else {
				draggingFrame = event.target.parentElement;
				dragStartX = event.touches[0].clientX - event.target.parentElement.offsetLeft;
				dragStartY = event.touches[0].clientY - event.target.parentElement.offsetTop;
			}
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
		} else if (event.target.id === "attachCameraButton") {
			const menu = event.target.closest(".menu");
			if (!menu) return;

			const bodyIndex = parseInt(menu.dataset.bodyIndex);
			const body = scene.getObjectByName("CelestialBodies").children[bodyIndex];
			if (!body) return;

			touchedBody = body;
		} /* else if (event.target.classList.contains("left-panel__button")) {
			handleLeftPanelButtons(event);
		} else if (event.target === renderer.domElement) {
			handleCanvasClick(event);
		} */
	});

	window.addEventListener("touchmove", (event) => {
		if (draggingFrame) {
			event.preventDefault();
			draggingFrame.style.left = (event.touches[0].clientX - dragStartX) + "px";
			draggingFrame.style.top = (event.touches[0].clientY - dragStartY) + "px";

			if (draggingFrame.id === "axesHelper") {
				requestRenderIfNotRequested();
			}
			return;
		} else if (resizingFrame) {
			// resize frame
			const minWidth = 150;
			const minHeight = 50;
			const maxWidth = window.innerWidth - resizingFrame.offsetLeft;
			const maxHeight = window.innerHeight - resizingFrame.offsetTop;
			let newWidth = event.touches[0].clientX - resizingFrame.offsetLeft;
			let newHeight = event.touches[0].clientY - resizingFrame.offsetTop;
			newWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);
			newHeight = Math.min(Math.max(newHeight, minHeight), maxHeight);
			resizingFrame.style.width = newWidth + "px";
			resizingFrame.style.height = newHeight + "px";

			if (resizingFrame.id === "axesHelper") {
				requestRenderIfNotRequested();
			}
		}
	});

	window.addEventListener("touchend", (event) => {
		draggingFrame = null;
		resizingFrame = null;

		if (touchedBody) {
			if (event.target === touchedBody) {
				attachCameraToBody(body);
			} else {
				touchedBody = null;
			}
		}
	});

	window.addEventListener("touchcancel", (event) => {
		draggingFrame = null;
		resizingFrame = null;
	});
}

function listenMouse() {
	window.addEventListener("mousedown", (event) => {
		// drag/resize frames
		if (event.target.classList.contains("drag-resize-container")) {
			const rect = event.target.getBoundingClientRect();
			const mouseX = event.clientX - rect.left;
			const mouseY = event.clientY - rect.top;
			const cornerSize = 20;
			if (mouseX > rect.width - cornerSize && mouseY > rect.height - cornerSize) {
				resizingFrame = event.target.parentElement;
				dragStartX = event.clientX;
				dragStartY = event.clientY;
			} else {
				draggingFrame = event.target.parentElement;
				dragStartX = event.clientX - event.target.parentElement.offsetLeft;
				dragStartY = event.clientY - event.target.parentElement.offsetTop;
			}
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
		} else if (event.target.id === "attachCameraButton") {
			const menu = event.target.closest(".menu");
			if (!menu) return;

			const bodyIndex = parseInt(menu.dataset.bodyIndex);
			const body = scene.getObjectByName("CelestialBodies").children[bodyIndex];
			if (!body) return;

			if (!camera.userData.focusTarget || camera.userData.focusTarget !== body) {
				attachCameraToBody(body);
			} else {
				detachCamera();
			}
		} else if (event.target.classList.contains("frame__control")) {
			handleFrameControls(event);
		} else if (event.target.classList.contains("left-panel__button")) {
			handleLeftPanelButtons(event);
		} else if (event.target === renderer.domElement) {
			handleCanvasClick(event);
		}
	});
	window.addEventListener("mousemove", handleMouseMove);
	window.addEventListener("mouseup", (event) => {
		draggingFrame = null;
		resizingFrame = null;
	});
}

function handleLeftPanelButtons(event) {
	switch (event.target.id) {
		case "toggleAxesHelper":
			const axesHelperFrame = document.getElementById("axesHelper");
			axesHelperFrame.classList.toggle("active");
			axesScene.visible = !axesScene.visible;
			requestRenderIfNotRequested();
			break;

		case "toggleVectorsAppearance":
			const celestialBodies = scene.getObjectByName("CelestialBodies");
			if (!celestialBodies) return;
			celestialBodies.children.forEach((body) => {
				const velocityVector = body.getObjectByName(`velocityVector_${body.userData.index}`);
				if (!velocityVector) return;
				velocityVector.visible = !velocityVector.visible;
			});
			requestRenderIfNotRequested();
			break;

		case "toggleNotesPanel":
			const notesPanel = document.getElementById("notes");
			notesPanel.classList.toggle("active");
			break;
	}
}

function handleFrameControls(event) {
	const frame = event.target.closest(".frame");

	switch (event.target.dataset.action) {
		case "close":
			frame.dataset.pinned = "false";
			frame.classList.remove("active");
			if (frame.id === "axesHelper") {
				axesScene.visible = false;
				requestRenderIfNotRequested();
			}
			break;

		case "pin":
			if (frame.dataset.pinned === "true") {
				frame.dataset.pinned = "false";
			} else {
				frame.dataset.pinned = "true";
			}
			break;

		case "minimize":
			frame.classList.toggle("frame__minimized");
			frame.dataset.forcePinned == "true" ? frame.dataset.forcePinned = "false" : frame.dataset.forcePinned = "true";

			if (frame.id === "axesHelper") {
				axesScene.visible = !axesScene.visible;
				requestRenderIfNotRequested();
			}
			break;
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
		detachCamera();
		// do not reset customized params here
		// extract it to a separate UI element
		resetWorld();
		updateBodyView();
		requestRenderIfNotRequested();
	});
}

function closeAllOverlays() {
	const activeFrames = document.querySelectorAll(".frame.active");
	activeFrames.forEach((frame) => {
		if (frame.dataset.pinned === "true" || frame.dataset.forcePinned === "true") return;
		frame.classList.remove("active");
		if (frame.id === "axesHelper") {
			axesScene.visible = false;
			requestRenderIfNotRequested();
		}
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

	if (!target) console.warn(intersects);

	openBodyView(target.parent);
}

function handleMouseMove(event) {
	// interface
	if (draggingFrame) {
		draggingFrame.style.left = (event.clientX - dragStartX) + "px";
		draggingFrame.style.top = (event.clientY - dragStartY) + "px";

		if (draggingFrame.id === "axesHelper") {
			requestRenderIfNotRequested();
		}

		return;
	} else if (resizingFrame) {
		// resize frame
		const minWidth = 150;
		const minHeight = 50;
		const maxWidth = window.innerWidth - resizingFrame.offsetLeft;
		const maxHeight = window.innerHeight - resizingFrame.offsetTop;
		let newWidth = event.clientX - resizingFrame.offsetLeft;
		let newHeight = event.clientY - resizingFrame.offsetTop;

		newWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);
		newHeight = Math.min(Math.max(newHeight, minHeight), maxHeight);

		resizingFrame.style.width = newWidth + "px";
		resizingFrame.style.maxWidth = newWidth + "px";
		resizingFrame.style.height = newHeight + "px";

		if (resizingFrame.id === "axesHelper") {
			requestRenderIfNotRequested();
		}

		return;
	}

	// canvas
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