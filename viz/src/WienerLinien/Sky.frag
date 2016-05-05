	uniform vec3 topColor;
	uniform vec3 middleColor;
	uniform vec3 bottomColor;
	uniform vec3 lightMixColor;


	uniform float mixFactor;
	uniform float offset;
	uniform float exponent;
	varying vec3 vWorldPosition;

	void main() {
		float h = (vWorldPosition.y/1000.0 - 0.1) * 2.0;	//*8.0
		vec3 fg = mix( middleColor, topColor, max( pow( max( h, 0.0), exponent ), 0.0 ) );
		h = vWorldPosition.y/1000.0*2.0;
		vec3 c = vec3( mix( bottomColor, fg, max( pow( max( h , 0.0), exponent ), 0.0 ) ));

		//c = mix(c, lightMixColor, mixFactor);

		gl_FragColor = vec4(c, 1.0);
	}
