
uniform vec3 slowColor;
uniform vec3 fastColor;

uniform float distanceZ;
uniform float distanceX;
uniform float pulse;
uniform float speed;

varying vec2 vUv;

void main( void ) {
  vec2 position = abs(-1.0 + 2.0 * vUv);

  float edging = abs((pow(position.y, 5.0) + pow(position.x, 5.0)) / 2.0);
  float perc = (0.2 * pow(speed + 1.0, 2.0) + edging * 0.8) * distanceZ * distanceX;

  vec3 color = mix(slowColor, fastColor, speed);

/*
  float red = r * perc + pulse;
  float green = g * perc + pulse;
  float blue = b * perc + pulse;
  */

  gl_FragColor = vec4(color, 1.0);
}
