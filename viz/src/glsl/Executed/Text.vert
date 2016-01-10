  #pragma glslify: pnoise3 = require(glsl-noise/periodic/3d)
  #pragma glslify: PI = require('glsl-pi')

  varying vec2 vUv;
  varying float vNoise;

  uniform float iGlobalTime;

            void main()
            {
                vUv = uv;
                // First perlin passes
                float speed = 1.0;
                float height = 5.0;

                float displacement  =  pnoise3(.4 * position + vec3( 0, speed * iGlobalTime, 0 ), vec3( 100.0 ) ) * 1. * .7;

                displacement       += pnoise3( 2. * position + vec3( 0, speed * iGlobalTime * 5., 0 ), vec3( 100. ) ) * .3 * height;
                 displacement       += pnoise3( 8. * position + vec3( 0, speed * iGlobalTime * 20., 0 ), vec3( 100. ) ) * .1 * 1.;

                // Sinus
                displacement = displacement + (sin(position.x / 2. - PI / 2.)) + 0.8;

                vec3 newPosition = vec3(position.x + displacement,position.y+displacement, 0.);//displacement*height);

                vNoise = displacement;
                //vNoise = sin(position.x / 2. - PI / 2.);
                //vec3 newPosition = position + normal * vec3(sin(iGlobalTime * 0.2) * 3.0);
                gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
            }
