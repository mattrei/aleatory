varying vec2 vUv;
varying vec3 vColor;

uniform float uTime;
uniform sampler2D bgImg;


        void main()
        {
            vec2 p = -1.0 + 2.0 *vUv;

          /*
            float d = length(vPos);
            float fade = smoothstep(0.1, 0.9, d);


            float r = .5 + sin(time);
            float g = .5 + cos(time);
            float b = 1. - sin(time);

            vec3 color = vec3(r,g,b);
            */

            //vec3 color = vec3(texture2D(bgImg, gl_PointCoord ));

            //gl_FragColor = texture2D(bgImg, gl_PointCoord );
            //gl_FragColor = vec4(gl_PointCoord.x, gl_PointCoord.y, 0.0, 1.0);
          gl_FragColor = vec4(vColor, 1.0);

        }
