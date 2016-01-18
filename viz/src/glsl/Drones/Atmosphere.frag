uniform float glowIntensity;
        uniform float redIntensity;
        varying vec3 vNormal;
        void main() {
          float intensity = pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), glowIntensity * 5. );
          vec3 color = mix(vec3(1.,1.,1.), vec3(.5,0.,0.), redIntensity);
          gl_FragColor = vec4( color, 1.0 ) * intensity ;
        }
