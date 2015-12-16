#pragma glslify: PI = require('glsl-pi')

varying vec2 vUv;
//varying float vNoise;
uniform float time;
uniform float speed;

        void main()
        {
            vec2 p = -1.0 + 2.0 *vUv;
            float alpha = sin(p.y * PI) / 2.;

            float time2 = time / (1. / speed) * 0.3;

            float r = .5 + sin(time2);
            float g = .5 + cos(time2);
            float b = 1. - sin(time2);

            vec3 color = vec3(r,g,b);
            //color *= vNoise;

            gl_FragColor = vec4(color, alpha);
        }
