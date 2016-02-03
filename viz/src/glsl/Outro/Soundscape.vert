attribute vec3 color;
attribute vec3 size;


vColor = customColor;
        vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
                //gl_PointSize = size;
                gl_PointSize = size * ( 300.0 / length( mvPosition.xyz ) );
                gl_Position = projectionMatrix * mvPosition;
            }
