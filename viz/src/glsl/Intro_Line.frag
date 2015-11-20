uniform float speed;

uniform float time;

        void main()
        {
            //vec2 p = -1.0 + 2.0 *vUv;

            //float fade = smoothstep(0.1, 0.9, d);


            float time2 = time * speed; // / (1. / speed);

            float r = .5 + sin(time2);
            float g = .5 + cos(time2);
            float b = 1. - sin(time2);

            vec3 color = vec3(r,g,b);

            gl_FragColor = vec4(color, 1.0);
        }