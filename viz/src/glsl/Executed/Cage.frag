void main() {
    vec2 center = vec2(0.5, 0.5);
    float t = 0.1 / length(gl_PointCoord - center);
    t = pow(t, 3.0);
    gl_FragColor = vec4(t * 0.1, t * 0.2, t * 0.4, 1.0);
}
