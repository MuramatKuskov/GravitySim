import { render } from "./utils/renderUtils.js";
import { initWorld } from "./modules/world.js";
import { initUI } from './modules/UI.js';

async function main() {
	const startTime = performance.now();
	await initWorld();
	// UI params are set from world data
	// so here comes order
	initUI();
	render(startTime);
}

main();