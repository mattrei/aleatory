uniform float smashAmplitude;
attribute vec3 displacement;

  varying vec2 vUv;
   void main() {
        vUv = uv;

        vec3 newPosition = position + normal * smashAmplitude * displacement;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      }
