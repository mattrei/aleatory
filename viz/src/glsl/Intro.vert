  #pragma glslify: pnoise3 = require(glsl-noise/periodic/3d)
  #pragma glslify: PI = require('glsl-pi')

  varying vec2 vUv;
  varying float vNoise;
  
            // varying vec3  v_line_color;

            uniform float time;
            uniform float speed;
            uniform float height;
            //uniform float valley_elevation;
            uniform float noise_elevation;


            void main()
            {
                vUv = uv;
                // First perlin passes
                float displacement  =  pnoise3(.4 * position + vec3( 0, speed * time, 0 ), vec3( 100.0 ) ) * 1. * .7;

                displacement       += pnoise3( 2. * position + vec3( 0, speed * time * 5., 0 ), vec3( 100. ) ) * .3 * height;
                 displacement       += pnoise3( 8. * position + vec3( 0, speed * time * 20., 0 ), vec3( 100. ) ) * .1 * 1.;

                // Sinus
                displacement = displacement + (sin(position.x / 2. - PI / 2.)) + 0.8;

                vec3 newPosition = vec3(position.x,position.y, displacement*height);

                vNoise = displacement;
                //vNoise = sin(position.x / 2. - PI / 2.);
                //vec3 newPosition = position + normal * vec3(sin(time * 0.2) * 3.0);
                gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
            }
