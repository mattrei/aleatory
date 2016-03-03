         uniform vec3 bcolor;
            uniform sampler2D texture;

            varying vec3 vColor;
            void main() {
                gl_FragColor = vec4( bcolor * vColor, 1.0 );
                gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord );
            }
