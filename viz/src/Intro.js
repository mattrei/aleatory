import THREE from 'three'; 
import dat   from 'dat-gui' ;
import Stats from 'stats-js' ;
import MathF from 'utils-perf'
var Line = require('three-line-2d')(THREE)
import Bezier from 'adaptive-bezier-curve'

const OrbitControls = require('three-orbit-controls')(THREE);

const Velocity = require('velocity-animate')
require('velocity-animate/velocity.ui')


var WAGNER = require('@superguigui/wagner');
var BloomPass = require('@superguigui/wagner/src/passes/bloom/MultiPassBloomPass');

const FLY_CURVE = 20
const MAX_POINTS = 500
const TRIANGLE_GAP = 500
const NUM_TRIANGLES = 15

class Demo {
  constructor(args) 
  {
    
    this.counter = 0
    this.gui = null
    this.introText = ''
    this.plane = null
    this.shakeX = 0
    this.shakeY = 0


    this.flyingSpeed = 1
    this.triangles = []
    this.flyingLine = null

    this.text = {intro: null, title: null}

    this.rotX = 0

    this.uniforms = {}
    this.speed = 1.0;
    this.height = 1.0;

    this.startStats();
    this.startGUI();

    this.multiPassBloomPass = null
    this.composer = null
    this.renderer = null;
    this.camera   = null;
    this.scene    = null;
    this.clock    = new THREE.Clock();

    this.createTextDiv()
    this.createRender();
    this.createScene();
    this.createPp()
    this.addObjects();

    this.createTriangles()
    this.createFlyingLine()

    this.onResize();
    this.update();
  }

  createTextDiv() 
  {
    let div = document.createElement('div')
    div.id = "textIntro"
    div.style.cssText = `
      font-family:Helvetica,Arial,sans-serif;font-size:40px;font-weight:normal;line-height:15px;color:white;
      `
    div.style.position = "absolute"
    div.style.width = "100%"
    div.style['text-align'] = "center"
    div.style.top = "50%"
    document.body.appendChild(div)

    this.text.intro = div

    div = document.createElement('div')
    div.id = "textTitle"
    div.style.cssText = `
      font-family:Helvetica,Arial,sans-serif;font-size:60px;font-weight:bold;line-height:15px;color:white;
      `
    div.style.position = "absolute"
    div.style.width = "100%"
    div.style['text-align'] = "center"
    div.style.top = "30%"
    document.body.appendChild(div)

    div.innerHTML = "aleatory"

    this.text.title = div
  }

  updateIntroText() {
    Velocity.animate(this.text.intro, "fadeOut", this.transition/4)
      .then((e) => {
        this.text.intro.innerHTML = this.introText
        Velocity(this.text.intro, "fadeIn", this.transition )
      })
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
        clearColor: 0,
        clearAlpha: 1 
    } );
    document.body.appendChild(this.renderer.domElement)
  }

  createTriangles()
  {


    let geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(-1, 0, 0));
    geometry.vertices.push(new THREE.Vector3(0, 1, 0));
    geometry.vertices.push(new THREE.Vector3(1, 0, 0));
    geometry.vertices.push(new THREE.Vector3(-1, 0, 0));


    let material = new THREE.ShaderMaterial( { 
        uniforms: this.uniforms,
        vertexShader: triangleVertexShader,
        fragmentShader: fragmentShader
    } );


    for (let i=0; i<NUM_TRIANGLES; i++) {
      let line = new THREE.Line(geometry, material);
      this.scene.add(line)

      //line.position.y = Math.sin(i * 0.5) * 40
      line.position.z = -i * TRIANGLE_GAP
      line.position.y = Math.sin(line.position.z * 0.0025) * FLY_CURVE
      line.position.X = Math.sin(line.position.z * 0.0025) * FLY_CURVE

      line.scale.x = line.scale.y = 40
      line.updateMatrix()

      this.triangles.push(line)


      if (i !== 0) {
        // create connecting lines in between
        var quality = 5
        
        
        let f = this.triangles[i-1]
        let l = this.triangles[i]

        let curve1 = Bezier([f.position.x, f.position.y], [10, 20], [20, 30], [l.position.x, l.position.y], quality)
        

        //create our geometry 
        let geom1 = Line(curve1)
        //let geom2 = Line(curve2)

        let mesh1 = new THREE.Mesh(geom1, material)
        this.scene.add(mesh1)

        //let mesh2 = new THREE.Mesh(geom1, material)
        //this.scene.add(mesh2)
      }
    }
  }

  createFlyingLine() {

    var geometry = new THREE.BufferGeometry();

    var positions = new Float32Array( MAX_POINTS * 3 ); // 3 vertices per point
    geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );

    // drawcalls
    //drawCount = 2; // draw the first 2 points, only
    geometry.setDrawRange( 0, 2 );

    var material = new THREE.LineBasicMaterial( { color: 0xff0000, linewidth: 2 } );

    this.flyingLine = new THREE.Line( geometry,  material );
    this.scene.add( this.flyingLine );

    this.flyingLine.geometry.attributes.position.needsUpdate = true; // required after the first render
  }

  fly() 
  {
    this.camera.position.z -= this.flyingSpeed
    this.plane.position.z -= this.flyingSpeed

    this.triangles.forEach(t => {
      //t.position.z += this.flyingSpeed * 10

      if (t.position.z > this.camera.position.z) {
        t.position.z =  (this.camera.position.z - TRIANGLE_GAP * NUM_TRIANGLES)
      }
    })

    this.camera.position.y = Math.sin(this.camera.position.z * 0.0025) * FLY_CURVE
    this.camera.position.x = Math.sin(this.camera.position.z * 0.0025) * FLY_CURVE


    this.plane.position.y = this.camera.position.y - 150
    
    let drawCount = ( this.counter + 1 ) % MAX_POINTS;
    this.flyingLine.geometry.setDrawRange( 0, drawCount );

    //this.updatePositions()

    //this.camera.position.y = Math.sin(i * 0.25) * 40
  }


  // update positions
  updatePositions() {

    var positions = this.flyingLine.geometry.attributes.position.array;

    let x = 0,
       y = 0,
      z = 0,
      index = 0

    for ( var i = 0, l = MAX_POINTS; i < l; i ++ ) {

      positions[ index ++ ] = x;
      positions[ index ++ ] = y;
      positions[ index ++ ] = z;

      x += ( Math.random() - 0.5 ) * 30;
      y += ( Math.random() - 0.5 ) * 30;
      z += ( Math.random() - 0.5 ) * 30;

    }

}

  createScene()
  {
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 4000 );
    this.camera.position.set(0, 45, 240);
    //this.camera.lookAt(new THREE.Vector3(0, 145, 0).normalize())

    //this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    //this.controls.maxDistance = 500;

    this.scene = new THREE.Scene();
  }

  createPp ()
  {
    this.composer = new WAGNER.Composer( this.renderer, { useRGBA: false } );
    this.composer.setSize( window.innerWidth, window.innerHeight );

    this.bloomPass = new BloomPass({
      blurAmount: 2,
      applyZoomBlur: true
    });
  }

  addObjects()
  {
    var gridHelper = new THREE.GridHelper( 100, 10 );        
    //this.scene.add( gridHelper );

    this.uniforms = {
        resolution: { type: "v2", value: new THREE.Vector2(window.innerWidth,window.innerHeight) },
        time: { type: "f", value: 0.1 },
        speed: { type: "f", value: this.speed},
        height: { type: "f", value: this.height},
        noise_elevation: { type: "f", value: 1.0},
    };

    var planeMaterial = new THREE.ShaderMaterial( { 
        uniforms: this.uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true
        //wireframe: true
    } );

    var geometry = //new THREE.PlaneGeometry( window.innerWidth / (window.innerWidth+window.innerHeight), window.innerHeight / (window.innerWidth+window.innerHeight), 0);
new THREE.PlaneBufferGeometry(window.innerWidth, window.innerHeight,10,10);

    //geometry = new THREE.BoxGeometry(100, 10, 10, 20 ,20 ,20)
    //planeMaterial = new THREE.NormalMaterial()
    this.plane = new THREE.Mesh(geometry, planeMaterial);

    this.plane.rotation.set(-Math.PI * 0.5,0,0)
    this.plane.position.y = -window.innerHeight*0.15
    //plane.rotateOnAxis('X', Math.PI)
    this.scene.add(this.plane);

  }

  startGUI()
  {
    this.gui = new dat.GUI()
    this.gui.add(this, 'speed', 0.1, 10)
    this.gui.add(this, 'height', 1, 20)

    this.gui.add(this, 'introText')
    this.gui.add(this, 'updateIntroText')

    this.gui.add(this, 'rotX', -Math.PI * 2, Math.PI * 2)
    this.gui.add(this, 'flyingSpeed', 1, 20)    
    this.gui.add(this, 'shakeX', -20, 20)    
    this.gui.add(this, 'shakeY', -20, 20)    
  }

  renderPass() {
      this.renderer.autoClearColor = true;
      this.composer.reset();
      this.composer.render( this.scene, this.camera );
        
      this.composer.pass( this.bloomPass );

      this.composer.toScreen();
    }

  update()
  {
    this.stats.begin();

      // Iterate over all controllers
      for (var i in this.gui.__controllers) {
        this.gui.__controllers[i].updateDisplay();
      }

      this.counter++


    this.camera.position.x *= Math.sin(this.counter * 0.25) * this.shakeX
    this.camera.position.y *= Math.sin(this.counter * 0.25) * this.shakeY

          //this.camera.rotation.set(this.rotX,0,0)
      //    this.plane.rotation.y = this.rotX
        //  this.plane.rotation.z = this.rotX

    this.uniforms.time.value += this.clock.getDelta();
    this.uniforms.speed.value = this.speed;
    this.uniforms.height.value = this.height;

    this.fly()

    //this.renderPass()
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

  onVariable(name, val) 
  {
    this[name] = val;
  }
  onFunc(name) 
  {
    let f = this[name]
    f = f.bind(this)
    f()
  }
}

export default Demo;

const triangleVertexShader = `
varying vec2 vUv;
void main()
{
  vUv = uv;
  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
  gl_Position = projectionMatrix * mvPosition;
}
`

const vertexShader = `
  varying vec2 vUv;
  varying float vNoise;

  #define M_PI 3.1415926535897932384626433832795
     vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; } 
     vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; } 
     vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); } 
     vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; } 
     vec3 fade(vec3 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); } 
     float pnoise(vec3 P, vec3 rep) { vec3 Pi0 = mod(floor(P), rep); vec3 Pi1 = mod(Pi0 + vec3(1.0), rep); Pi0 = mod289(Pi0); Pi1 = mod289(Pi1); vec3 Pf0 = fract(P); vec3 Pf1 = Pf0 - vec3(1.0); vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x); vec4 iy = vec4(Pi0.yy, Pi1.yy); vec4 iz0 = Pi0.zzzz; vec4 iz1 = Pi1.zzzz; vec4 ixy = permute(permute(ix) + iy); vec4 ixy0 = permute(ixy + iz0); vec4 ixy1 = permute(ixy + iz1); vec4 gx0 = ixy0 * (1.0 / 7.0); vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5; gx0 = fract(gx0); vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0); vec4 sz0 = step(gz0, vec4(0.0)); gx0 -= sz0 * (step(0.0, gx0) - 0.5); gy0 -= sz0 * (step(0.0, gy0) - 0.5); vec4 gx1 = ixy1 * (1.0 / 7.0); vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5; gx1 = fract(gx1); vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1); vec4 sz1 = step(gz1, vec4(0.0)); gx1 -= sz1 * (step(0.0, gx1) - 0.5); gy1 -= sz1 * (step(0.0, gy1) - 0.5); vec3 g000 = vec3(gx0.x,gy0.x,gz0.x); vec3 g100 = vec3(gx0.y,gy0.y,gz0.y); vec3 g010 = vec3(gx0.z,gy0.z,gz0.z); vec3 g110 = vec3(gx0.w,gy0.w,gz0.w); vec3 g001 = vec3(gx1.x,gy1.x,gz1.x); vec3 g101 = vec3(gx1.y,gy1.y,gz1.y); vec3 g011 = vec3(gx1.z,gy1.z,gz1.z); vec3 g111 = vec3(gx1.w,gy1.w,gz1.w); vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110))); g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w; vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111))); g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w; float n000 = dot(g000, Pf0); float n100 = dot(g100, vec3(Pf1.x, Pf0.yz)); float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z)); float n110 = dot(g110, vec3(Pf1.xy, Pf0.z)); float n001 = dot(g001, vec3(Pf0.xy, Pf1.z)); float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z)); float n011 = dot(g011, vec3(Pf0.x, Pf1.yz)); float n111 = dot(g111, Pf1); vec3 fade_xyz = fade(Pf0); vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z); vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y); float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); return 2.2 * n_xyz; }

  
            // varying vec3  v_line_color;

            uniform float time;
            uniform float speed;
            uniform float height;
            //uniform float valley_elevation;
            uniform float noise_elevation;


            void main()
            {
                vUv = uv;
                // First perlin passes
                float displacement  = pnoise( .4 * position + vec3( 0, speed * time, 0 ), vec3( 100.0 ) ) * 1. * .7;
                 displacement       += pnoise( 2. * position + vec3( 0, speed * time * 5., 0 ), vec3( 100. ) ) * .3 * height;
                 displacement       += pnoise( 8. * position + vec3( 0, speed * time * 20., 0 ), vec3( 100. ) ) * .1 * 1.;

                
                // Sinus
                displacement = displacement + (sin(position.x / 2. - M_PI / 2.)) + 0.8;

                vec3 newPosition = vec3(position.x,position.y, displacement*height);

                vNoise = displacement;
                //vNoise = sin(position.x / 2. - M_PI / 2.);
                //vec3 newPosition = position + normal * vec3(sin(time * 0.2) * 3.0);
                gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
            }

`
const fragmentShader = `
varying vec2 vUv;
//varying float vNoise;
uniform float time;
uniform float speed;

        #define M_PI 3.1415926535897932384626433832795

        void main()
        {
            vec2 p = -1.0 + 2.0 *vUv;
            float alpha = sin(p.y * M_PI) / 2.;

            float time2 = time / (1. / speed);

            float r = .5 + sin(time2);
            float g = .5 + cos(time2);
            float b = 1. - sin(time2);

            vec3 color = vec3(r,g,b);
            //color *= vNoise;

            gl_FragColor = vec4(color, alpha);
        }

`