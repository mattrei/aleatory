#pragma glslify: snoise3 = require('glsl-noise/simplex/3d')


uniform float distort;
uniform float time;

        varying vec3 vNormal;
        void main() {

        float radius = 1.0;

float updateTime = time / 10.0;
        float noise = snoise3(vec3(position / 400.1 + updateTime * 5.0));
        vec3 newPosition = position * (noise * pow(distort, 2.0) + radius);



          vNormal = normalize( normalMatrix * normal );
          gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
        }
