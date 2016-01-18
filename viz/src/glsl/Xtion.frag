	uniform sampler2D map;

			varying vec2 vUv;

			void main() {

				vec4 texture = texture2D( map, vUv );
        vec3 color = vec3(texture.rgb);

        color = mix(color, vec3(0.,1.,0.), 0.5);

				gl_FragColor = vec4( color.r, color.g, color.b, 0.2 );

			}
