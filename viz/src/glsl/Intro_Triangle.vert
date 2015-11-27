varying vec2 vUv;
uniform float dist;
varying vec3 vPos;
void main()
{
  vUv = uv;
  vPos = position.xyz;
 
  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
  gl_Position = projectionMatrix * mvPosition;

/*
  vec3 pointPos = position.xyz + vec3(vec2(thickness), 0.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4( pointPos, 1.0 );
  */
}