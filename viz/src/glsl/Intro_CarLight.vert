						uniform float size;
						uniform float scale;

						uniform float time;

						void main() {

							vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
							gl_Position = projectionMatrix * mvPosition;

						}