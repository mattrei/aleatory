#pragma glslify: snoise4 = require(glsl-noise/simplex/4d)
#pragma glslify: PI = require(glsl-pi)
#pragma glslify: ease = require(glsl-easings/quadratic-in)

attribute vec3 color;
attribute vec3 extra;
attribute vec2 puv;


uniform float uTime;
uniform float uTimeInit;
uniform float uAnimationSphere;
uniform float uAnimationFlat;

uniform vec2 uMatrightBottom;
uniform vec2 uMatleftTop;
uniform float uSphereRadius;


varying vec2 vUv;
varying vec3 vColor;


 		// convert the positions from a lat, lon to a position on a sphere.
    vec3 latLongToVector3(float lat, float lon, float radius) {
        float phi = (lat)*PI/180.0;
        float theta = (lon-180.0)*PI/180.0;

        float x = radius * cos(phi) * cos(theta);
        float y = radius * cos(phi) * sin(theta);
        float z = radius * sin(phi);

        // return vec3(x,y,z);
				// the above math calls Z up - 3D calls Y up
				// i don't know why it has to be negative :P
        return vec3(x,z,-y);
    }

		vec2 uvToLatLong(vec2 uvs, vec2 leftTop, vec2 rightBottom ) {
				// uv coordinates go from bottom-left to top-right
				// 0.0,0.0 is bottom left, 1.0,1.0 is top right, 0.5,0.5 is center
				// latLong coords go depending on which demisphere you're in
				float right = rightBottom.x;
				float bottom = rightBottom.y;
				float left = leftTop.x;
				float top = leftTop.y;
				float xDiff = right - left;
				float yDiff = bottom - top;

				// treat uv as a completion ratio from left to right and bottom to top
				float xPercent = left + ( xDiff * uvs.x );
				float yPercent = bottom - ( yDiff * uvs.y );

				vec2 latlong = vec2( xPercent, yPercent );
				return latlong;
		}

vec3 chaosPosition(vec3 pos) {
  float vel = uTime * 0.05;
  return vec3(pos.x + snoise4(vec4(pos.x, pos.y, pos.z, uTime * 0.1)) * 1000.,
              pos.y + snoise4(vec4(pos.x, pos.y, pos.z, uTime * 0.1 + 1.25)) * 1000.,
              pos.z + snoise4(vec4(pos.x, pos.y, pos.z, uTime * 0.1 + 12.25)) * 1000.);
}


   void main() {
        vUv = uv;
       vColor = color;
     vec3 pos = position;


      vec2 newLatLong = uvToLatLong(puv, uMatleftTop, uMatrightBottom);

			vec3 spherePosition = latLongToVector3(newLatLong.y, newLatLong.x, uSphereRadius);
      vec3 chaosPosition = chaosPosition(pos);
      vec3 flatPosition = position;

       vec3 newPosition = chaosPosition;

     newPosition = mix( newPosition, spherePosition, ease(uAnimationSphere));
     newPosition = mix( newPosition, flatPosition, ease(uAnimationFlat));


      //newPosition.z += sin(newPosition.x * 0.01 + newPosition.y * 0.01 + uTime * 10.) * 200.;

		  vec4 mvPosition = modelViewMatrix * vec4( newPosition, 1.0 );

        gl_Position = projectionMatrix * mvPosition;
       gl_PointSize = 25.0;
      }
