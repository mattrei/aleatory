#pragma glslify: pnoise3 = require('glsl-noise/periodic/3d')

varying vec3 vNormal;
varying vec2 vUv;
uniform float wobble;
uniform float time;

void main() {

    float speed = wobble * 10.;

	float displacement  =  pnoise3(.4 * position + vec3( 0, time, 0 ), vec3( 100.0 ) ) * 1. * .7;
    displacement += pnoise3( 2. * position + vec3( 0, speed * time * 5., 0 ), vec3( 100. ) ) * .3 ;
    displacement += pnoise3( 8. * position + vec3( 0, speed * time * 20., 0 ), vec3( 100. ) ) * .1 * 1.;

    vec3 newPosition = position + normal * displacement * wobble * 80.;

	gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
	vNormal = normalize( normalMatrix * normal );

	vUv = uv;
}
