#pragma glslify: snoise3 = require('glsl-noise/simplex/3d')

varying vec3 vNormal;
varying vec2 vUv;
uniform float distort;
uniform float time;

void main() {

    float updateTime = time / 10.0;
    float noise = snoise3(vec3(position / 400.1 + updateTime * 5.0));

/*
	float displacement  =  pnoise3(.4 * position + vec3( 0, time, 0 ), vec3( 100.0 ) ) * 1. * .7;
    displacement += pnoise3( 2. * position + vec3( 0, speed * time * 5., 0 ), vec3( 100. ) ) * .3 ;
    displacement += pnoise3( 8. * position + vec3( 0, speed * time * 20., 0 ), vec3( 100. ) ) * .1 * 1.;

*/

//  vec4 mvPosition = modelViewMatrix * vec4(position * (noise * pow(distort, 2.0) + radius), 1.0);
  float radius = 1.0;
    vec3 newPosition = position * (noise * pow(distort, 2.0) + radius);

	gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );

	vNormal = normalize( normalMatrix * normal );

	vUv = uv;
}
