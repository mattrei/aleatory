    precision mediump float;
    precision mediump int;

    varying float vAlpha;

    void main() {
        float d = length(gl_PointCoord.xy - .5) * 2.0;

        float c = 1.0 - clamp(d, 0.0, 1.0);

        vec3 color = mix(vec3(0.8, 0.7, 1.0), vec3(1.0), vAlpha);

        gl_FragColor = vec4(color, vAlpha * c);

    }