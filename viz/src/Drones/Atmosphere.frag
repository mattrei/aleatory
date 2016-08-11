uniform float glowIntensity;
        uniform float redIntensity;
        uniform vec3 uColor;
        varying vec3 vNormal;


        void main() {
          float intensity = pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), glowIntensity * 5. );
          vec3 color = uColor;
          gl_FragColor = vec4( color, 1.0 ) * intensity ;
        }
