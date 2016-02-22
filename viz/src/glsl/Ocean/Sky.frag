	uniform vec3 topColor;
	uniform vec3 middleColor;
	uniform vec3 bottomColor;
	uniform float offset;
	uniform float exponent;
	varying vec3 vWorldPosition;

	float rand(vec2 co);

	void main() {
		float h = (vWorldPosition.y/1000.0 - 0.1) * 8.0;
		vec3 fg = mix( middleColor, topColor, max( pow( max( h, 0.0), 0.8 ), 0.0 ) );
		h = vWorldPosition.y/1000.0*2.0;
		gl_FragColor = vec4( mix( bottomColor, fg, max( pow( max( h , 0.0), 0.8 ), 0.0 ) ), 1.0 );
	}

	float rand(vec2 co){
	    return fract(sin(dot(co.xy,vec2(12.9898,78.233))) * 43758.5453);
	}
