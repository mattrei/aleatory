uniform vec3 color;
uniform sampler2D texture;
uniform float useTexture;
uniform float fog;

varying vec3 vColor;

void main() {

  float fogFactor = fog;

  if (fogFactor == 0.0) {
    float depth = gl_FragCoord.z / gl_FragCoord.w;
    fogFactor = smoothstep( 200.0, 100.0, depth );
  }

  gl_FragColor = vec4( (color * vColor) * fogFactor, 1.0 );
  gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord );

}
