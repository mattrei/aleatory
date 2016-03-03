  uniform float amplitude;

    attribute float size;
    attribute vec3 color;

    varying vec3 vColor;
    void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
                //gl_PointSize = size;
                gl_PointSize = size * ( 300.0 / length( mvPosition.xyz ) );
                gl_Position = projectionMatrix * mvPosition;
            }
