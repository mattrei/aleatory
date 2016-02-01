varying vec2 vUv;
varying vec3 vColor;

uniform float uTime;

        void main()
        {
          vec2 center = vec2(0.5, 0.5);
          float t = 0.05 / length(gl_PointCoord - center);
          t = pow(t, 2.5);
          vec3 final = vec3(t);
          final *= vColor;

          gl_FragColor = vec4(final, 1.0);

        }
