#pragma glslify: pnoise2 = require(glsl-noise/periodic/2d)

varying vec2 vUv;
uniform float iGlobalTime;

float Hash( vec2 p)
{
     vec3 p2 = vec3(p.xy,1.0);
    return fract(sin(dot(p2,vec3(37.1,61.7, 12.4)))*3758.5453123);
}

float noise(in vec2 p)
{
    vec2 i = floor(p);
     vec2 f = fract(p);
     f *= f * (3.0-2.0*f);

    return mix(mix(Hash(i + vec2(0.,0.)), Hash(i + vec2(1.,0.)),f.x),
               mix(Hash(i + vec2(0.,1.)), Hash(i + vec2(1.,1.)),f.x),
               f.y);
}

float fbm(vec2 p)
{
     float v = 0.0;
     v += noise(p*1.0)*.5;
     v += noise(p*2.)*.25;
     v += noise(p*4.)*.125;
     return v;
}

vec3 clouds( vec2 uv, vec2 dir )
{
  dir *= iGlobalTime * 5.;
  vec3 finalColor = fbm( (uv * 0.2) + dir ) * vec3( 1.0 );

  return finalColor;
}

        void main()
        {
          vec2 uv = -1.0 + 2.0 *vUv;
          vec3 finalColor = vec3(0.0);

          finalColor += sin( clouds( uv, vec2( 1.0, 0.1 ) ));

          finalColor = 1. - finalColor;

          gl_FragColor = vec4(finalColor, finalColor);
        }
