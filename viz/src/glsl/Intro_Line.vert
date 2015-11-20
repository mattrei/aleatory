#pragma glslify: pnoise2 = require(glsl-noise/periodic/2d)
#pragma glslify: snoise2 = require(glsl-noise/simplex/2d)

uniform float speed;
uniform float time;

void main() {

	float amplitude = speed;
	float displacement2 = pnoise2(.4 * position.xy + vec2( time * 0.5, time * 0.2), vec2( 100.0 ) ) * 3.5;
	float displacement = snoise2(.4 * position.xy + vec2( 0.5, 0.2)) * 3.5;
	//displacement += pnoise2(8. * position.xy + vec2( time, time), vec2( 100.0 ) ) * 1.5;
	
	vec3 newPosition = position + vec3(amplitude * displacement);

	gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
	
}