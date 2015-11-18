#pragma glslify: pnoise2 = require(glsl-noise/periodic/2d)

varying vec2 vUv;

uniform float numberCurrents;
uniform float time;
uniform float showCurrent;
uniform vec2 resolution;

uniform sampler2D bgImg;


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
  dir *= time;
  vec3 finalColor = fbm( (uv * 1.5) + dir ) * vec3( 1.0 );  
  
  return finalColor;
}

vec3 lightning( vec2 uv )
{
  float timeVal = time;
  vec3 finalColor = vec3( 0.0 );
  for( int i=0; i < 8; ++i )
  {
    float indexAsFloat = float(i);
    float amp = 40.0 + (indexAsFloat*1.0);
    float period = 2.0 + (indexAsFloat+2.0);
    
    float thickness = mix( 0.1, 0.7, uv.y * 0.5 + 0.5 );
    
    float intensity = mix( 0.5, 1.5, noise(uv*10.0) );
    float t = abs( thickness / (sin(uv.x + fbm( uv + timeVal * period )) * amp) * intensity );
    float show = fract(abs(sin(timeVal))) >= 0.95 ? 1.0 : 0.0;
    show = showCurrent;
    show = (i < int(numberCurrents)) ? show : 0.0;
    show *= step( abs(fbm( vec2( sin(time * 50.0), 0.0 ) )), 0.4);
    
    
    finalColor +=  t * vec3( 0.3, 0.5, 2.0 ) * show;
  }
  
  return finalColor;
}

void main( void ) 
{

  vec2 uv = -1.0 + 2.0 *vUv;
  
  vec3 finalColor = vec3( 0.0 );

  finalColor += sin( clouds( uv, vec2( 1.0, 0.1 ) ));
  finalColor.rgb *= texture2D(bgImg, vUv ).rgb;

  float xOffset = mix( 0.5, -1.5, fbm(vec2( fract(time), 0.00 ) ) );
  vec2 uvOffset = vec2( xOffset, 0.0 );
  
  vec2 lightningUV = uv + uvOffset;
  
  float theta = 3.14159 * 2.1;
  lightningUV.x = uv.x * cos(theta) - uv.y*sin(theta); 
  lightningUV.y = uv.x * sin(theta) + uv.y*cos(theta); 
  
  finalColor += lightning( lightningUV + uvOffset );
  
  finalColor -= sin( clouds( uv, vec2( 2.0 ) )) * 0.30;

  gl_FragColor = vec4( finalColor, 1.0 );
}
