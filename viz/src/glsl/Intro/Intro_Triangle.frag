varying vec2 vUv;
varying vec3 vPos;

uniform float time;
uniform float speed;
uniform float dist;


        void main()
        {
            vec2 p = -1.0 + 2.0 *vUv;

            float d = length(vPos);
            float fade = smoothstep(0.1, 0.9, d);


            float time2 = time / (1. / speed);

            float r = .5 + sin(time2);
            float g = .5 + cos(time2);
            float b = 1. - sin(time2);

            vec3 color = vec3(r,g,b);

            gl_FragColor = vec4(color, 1.0);
        }