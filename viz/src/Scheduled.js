import THREE from 'three.js'; 
import dat   from 'dat-gui' ;
import Stats from 'stats-js' ;
import MathF from 'utils-perf'

const OrbitControls = require('three-orbit-controls')(THREE);


import ScheduledData from './test_data/scheduled.json'

class Demo {
  constructor(args) 
  {
    
    this.showCurrent = 0.0
    this.numberCurrents = 1

    this.scheduled = []
    this.scheduledIdx = 0

    this.startStats();
    this.startGUI();

    this.renderer = null;
    this.camera   = null;
    this.scene    = null;
    this.counter  = 0;
    this.clock    = new THREE.Clock();
    this.uniforms = {}

    this.createRender();
    this.createScene();
    this.addObjects();

    this.onResize();
    this.update();
  }

  startStats()
  {
    this.stats = new Stats(); 
    this.stats.domElement.style.position = 'absolute';
    document.body.appendChild(this.stats.domElement);
  }

  createRender()
  {
    this.renderer = new THREE.WebGLRenderer( {
        antialias : true,
        clearColor: 0
    } );
    document.body.appendChild(this.renderer.domElement)
  }

  createScene()
  {
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 4000 );
    this.camera.position.set(0, 45, 240);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.maxDistance = 500;

    this.scene = new THREE.Scene();
  }

  addObjects()
  {
    var gridHelper = new THREE.GridHelper( 100, 10 );        
    //this.scene.add( gridHelper );

    this.scheduled = []

    ScheduledData.forEach(s => {
      console.log(s)
      let texture = THREE.ImageUtils.loadTexture( s.img )
      texture.minFilter = THREE.LinearFilter

      this.scheduled.push({img: texture})
    })

    this.uniforms = {
        resolution: { type: "v2", value: new THREE.Vector2(window.innerWidth,window.innerHeight) },
        time: { type: "f", value: 0.1 },
        showCurrent: { type: "f", value: this.showCurrent},
        numberCurrents: { type: "f", value: this.numberCurrents},
        bgImg: { type: "t", value: this.scheduled[0].img },
    };

    this.uniforms.bgImg.value.wrapS = this.uniforms.bgImg.value.wrapT = THREE.ClampToEdgeWrapping

    var planeMaterial = new THREE.ShaderMaterial( { 
        uniforms: this.uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader
    } );

    var geometry = new THREE.PlaneBufferGeometry(500, 500,1,1);

    var plane = new THREE.Mesh(geometry, planeMaterial);
    plane.position.z = - 500;
    this.scene.add(plane);
  }


  nextScheduled() 
  {
    this.uniforms.bgImg.value = this.scheduled[this.scheduledIdx++ % this.scheduled.length].img
  }

  startGUI()
  {
    var gui = new dat.GUI()
    document.body.appendChild(gui.domElement.parentNode)
    gui.add(this, 'nextScheduled')
    gui.add(this, 'showCurrent', 0, 5)
    gui.add(this, 'numberCurrents', 1, 8)
  }

  update()
  {
    this.stats.begin();

    this.uniforms.time.value += this.clock.getDelta();
    this.uniforms.showCurrent.value = this.showCurrent 
    this.uniforms.numberCurrents.value = this.numberCurrents 


    this.renderer.render(this.scene, this.camera);

    this.stats.end()
    requestAnimationFrame(this.update.bind(this));
  }

  onResize()
  {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }
}

export default Demo;

const vertexShader = `
  varying vec2 vUv; 
   void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
`

const fragmentShader2 = `
 uniform vec2 resolution;
      void main() {
        vec2 coord = gl_FragCoord.xy;
        float xmid = resolution.x/2.0;
        float ymid = resolution.y/2.0;
    float x = (coord.x - xmid)/resolution.x;
        float y = (coord.y-ymid)/resolution.y;
    float r = sqrt(x*x + y*y)+0.5;
        vec4 color = vec4(1.0-vec2(r),1.3-r,1.0);
        gl_FragColor = color;
      }
`

const fragmentShader = `

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
`