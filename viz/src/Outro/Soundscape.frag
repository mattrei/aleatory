#pragma glslify: snoise3 = require(glsl-noise/simplex/3d)

uniform vec3 bcolor;
uniform vec3 tcolor;
uniform sampler2D texture;
uniform float time;

varying vec3 vColor;
varying vec3 vPos;
            void main() {

              float factor  = abs(snoise3(vec3(vPos.x / 50.0, vPos.y / 50.0, time * 0.3))) * 2.0;


                vec3 color = mix(bcolor, tcolor, factor);

                //gl_FragColor = vec4( bcolor * vColor, 1.0 );

                gl_FragColor = vec4( color, 1.0 );
                gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord );
            }
