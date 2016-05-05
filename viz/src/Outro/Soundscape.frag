#pragma glslify: snoise3 = require(glsl-noise/simplex/3d)
#pragma glslify: snoise2 = require(glsl-noise/simplex/2d)
#pragma glslify: hsl2rgb = require(glsl-hsl2rgb)

uniform vec3 bcolor;
uniform vec3 tcolor;
uniform sampler2D texture;
uniform float time;

varying vec3 vColor;
varying vec3 vPos;
            void main() {

              float factor  = abs(snoise3(vec3(vPos.x / 50.0, vPos.y / 50.0, time * 0.2))) * 2.0;

              float cFactor = abs(snoise2(vec2(vPos.x, time * 0.03))) * 360.;
              vec3 rgb = hsl2rgb(cFactor/360.0, 0.5, 0.5);

                vec3 color = mix(bcolor, rgb, factor);
                //gl_FragColor = vec4( bcolor * vColor, 1.0 );

                gl_FragColor = vec4( color, 1.0 );
                gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord );
            }
