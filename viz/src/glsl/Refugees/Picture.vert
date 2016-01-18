#pragma glslify: pnoise3 = require(glsl-noise/periodic/3d)
#pragma glslify: snoise3 = require(glsl-noise/simplex/3d)
#pragma glslify: snoise2 = require(glsl-noise/simplex/2d)
#pragma glslify: PI = require(glsl-pi)
#pragma glslify: curl = require(glsl-curl-noise)

attribute vec3 color;
attribute vec3 extras;


uniform float uTime;
uniform float uTimeInit;
uniform float uAnimation;

varying vec2 vUv;
varying vec3 vColor;
   void main() {
        vUv = uv;
       vColor = color;

      float time = uTime + uTimeInit;

       float displacement  =  pnoise3(.4 * position + vec3( 0, time, 0 ), vec3( 100.0 ) ) * 1. * .7;

       float animation = uAnimation;
       vec3 pos = position;

       pos.x += snoise3(position.xyz * 0.02 + 50.0 + time) * (200.0 + extras.y * 800.0) * animation;
       pos.y += snoise3(position.xyz * 0.01 + 2.0 + time) * (200.0 + fract(extras.y * 32.0) * 800.0) * animation;
       pos.z += snoise3(position.xyz * 0.03 + 100.0 + time) * (200.0 + fract(extras.z * 32.0) * 800.0) *  animation;

       //convert to polar coordinates
       // https://en.wikipedia.org/wiki/Spherical_coordinate_system
       float d = length(pos);//rho
       float phi = atan(pos.y, pos.x) + pow(d / 300.0, 0.3) * pow(animation, .5);
       float theta = acos(pos.z / d) + pow(d / 300.0, 0.3) * pow(animation, .5);

       // and back
       //pos.x = cos(angle) * d;
       //pos.y = sin(angle) * d;
       pos.x = sin(theta) * cos(phi) * d;
       pos.y = sin(theta) * sin(phi) * d;
       pos.z = cos(theta) * d;

       //vec3 curlPosition = curl(position + time); //+ (time * 0.05));
       //curlPosition *= - 50.;

       vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );

        gl_Position = projectionMatrix * mvPosition;
          //gl_PointSize = size * 300.0 / length(mvPosition.xyz);
       gl_PointSize = 1.0;
       //gl_PointSize = abs(sin(position.x + time));
      }
