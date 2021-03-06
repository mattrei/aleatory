#extension GL_OES_standard_derivatives : enable
precision highp float;


uniform float opacity;
uniform vec3 color;
uniform sampler2D map;
uniform float iGlobalTime;
uniform float animate;
varying vec2 vUv;

#pragma glslify: noise = require('glsl-noise/simplex/3d')
#pragma glslify: aastep = require('glsl-aastep')

#pragma glslify: hsl2rgb = require('glsl-hsl2rgb')

 vec3 render (float sdf) {
   float hue = noise(vec3(vUv.x * 0.0, sdf * 5.0, 0));
   return hsl2rgb(vec3(hue, 0.5, 0.5));
}

void main() {
  vec4 texColor = texture2D(map, vUv);
  float sdf = texColor.a;
  
  float alpha = 0.0;
  //float animValue = pow(abs(animate * 2.0 - 1.0), 2.0);
  //float threshold = animValue * 0.5 + 0.5;
  float threshold = 0.1;
  alpha += 0.15 * aastep(threshold, sdf + 0.4 * noise(vec3(vUv * 10.0, iGlobalTime)));
  alpha += 0.35 * aastep(threshold, sdf + 0.1 * noise(vec3(vUv * 50.0, iGlobalTime)));
  alpha += 0.15 * aastep(threshold, sdf);

  vec3 c = color;//render(sdf);

  gl_FragColor = vec4(c, alpha);
}