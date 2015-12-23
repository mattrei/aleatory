
attribute vec3 color;
attribute float size;

varying vec2 vUv;
varying vec3 vColor;
   void main() {
        vUv = uv;
       vColor = color;

       vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

        gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = size * 300.0 / length(mvPosition.xyz);
      }
