#pragma glslify: pnoise3 = require('glsl-noise/periodic/3d')

varying vec3 vNormal;
varying vec2 vUv;
uniform float wobble;
uniform float time;

void main() {

	float displacement  =  pnoise3(.4 * position + vec3( 0, time, 0 ), vec3( 100.0 ) ) * 1. * .7;

//	vec3 newPosition = vec3(position.x,position.y, displacement*wobble);
    
    vec3 newPosition = (position + normal * displacement) * displacement;

	//gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
	gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
	vNormal = normalize( normalMatrix * normal );

	vUv = uv;
}