#pragma glslify: pnoise3 = require(glsl-noise/periodic/3d)
#pragma glslify: snoise3 = require(glsl-noise/simplex/3d)
#pragma glslify: snoise2 = require(glsl-noise/simplex/2d)
#pragma glslify: PI = require(glsl-pi)

attribute vec3 color;
attribute vec3 extras;
attribute vec2 puv;


uniform float uTime;
uniform float uTimeInit;
uniform float uAnimation;

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


   void main() {
        vUv = uv;
       vColor = color;
     vec3 pos = position;

/*
       float R = 50.;
       float lng = position.x/R;
       float lat = 2. * atan(exp(position.y/R)) - PI/2.;

       float S = 10.;
       //pos.x = S * cos(lat) * cos(lng);
       //pos.y = S * cos(lat) * sin(lng);
       //pos.z = S * sin(lat);
       pos.x = S * sin(position.x) * cos(position.y);
       pos.y = S * sin(position.y);
       pos.z = S * cos(position.x) * cos(position.y);
       */

       vec2 newLatLong = uvToLatLong(puv, uMatleftTop, uMatrightBottom);

			vec3 goalPosition = latLongToVector3(newLatLong.y, newLatLong.x, uSphereRadius);
      // goalPosition *= 500.;
			vec3 newPosition = mix( position, goalPosition, pow(uAnimation) );

      //newPosition.z *= sin(uTime) * 10.;
			// original mvPosition setting
		  // vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
		  vec4 mvPosition = modelViewMatrix * vec4( newPosition, 1.0 );
      //vViewPosition = -mvPosition.xyz; // ah HA


       //vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );

        gl_Position = projectionMatrix * mvPosition;
      //gl_PointSize = size * 300.0 / length(mvPosition.xyz);
       gl_PointSize = 1.0;
      }
