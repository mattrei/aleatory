varying vec2 vUv;
varying vec3 vColor;

uniform float uTime;

        void main()
        {
          vec3 color = mix(vColor, vec3(1.0, 1.0, .0), sin(uTime));

          gl_FragColor = vec4(color, 1.0);

        }
