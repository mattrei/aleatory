precision mediump float;
//unused
void main() {
        vec2 center = vec2(0.5, 0.5);
        float t = 0.05 / length(gl_PointCoord - center);
        t = pow(t, 2.5);
        gl_FragColor = vec4(t, t, t, 1.0);
    }
