import * as THREE from 'three';
const textureLoader = new THREE.TextureLoader();

export function loadTexture(path) {
	return new Promise((resolve, reject) => {
		const texture = textureLoader.load(
			path,
			() => resolve(texture),
			undefined,
			(reject) => {
				console.error('Error loading texture:', reject);
				reject(reject);
			}
		);
	});
}

