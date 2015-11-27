#pragma glslify: pnoise3 = require('glsl-noise/periodic/3d')

uniform float time;
varying vec2 vUv;
varying vec3 vPos;
void main()
{

	float displacement  =  pnoise3(.4 * position + vec3( 0, time * 0.5, 0 ), vec3( 100.0 ) ) * 1. * .7;
	displacement *= 500.;

  vUv = uv;
  vPos = position.xyz;

  vec3 newPosition = vec3(position.x + displacement,position.y + displacement, position.z + displacement);
 
  vec4 mvPosition = modelViewMatrix * vec4( newPosition, 1.0 );
  gl_Position = projectionMatrix * mvPosition;
  gl_PointSize = sin(time + newPosition.x) * 4.;

/*
  vec3 pointPos = position.xyz + vec3(vec2(thickness), 0.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4( pointPos, 1.0 );
  */
}