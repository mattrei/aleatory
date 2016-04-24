void main()	{
    gl_PointSize = 80.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
