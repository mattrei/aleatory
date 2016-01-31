precision mediump float;

uniform mat4 modelViewMatrix;
	uniform mat4 projectionMatrix;

	attribute vec3 position;

	void main()	{
        gl_PointSize = 30.0;
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}
