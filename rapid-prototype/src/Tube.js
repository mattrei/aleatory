import THREE from 'three.js'; 
import OC    from 'three-orbit-controls';
import dat   from 'dat-gui' ;
import Stats from 'stats-js' ;
import TweenMax from 'gsap'
var Tweenr = require('tweenr')()
import MathF from 'utils-perf';

const COLS = 20
const ROWS = 60


const SIZE = {
  width: 15,
  height: 3,
  depth: 40
}


const GAP = 10
const ALL_DEPTH = ROWS * (SIZE.depth + GAP)
const ALL_WIDTH = COLS * (SIZE.width + GAP)

const CUBES_OFF = 40

const SPEED = {
  slow: 1,
  fast: 50
}


function num(min, max) { return Math.random() * (max - min) + min; }

const COLOURS = {
    slow: {
      r: num(0, 0.2),
      g: num(0.5, 0.9),
      b: num(0.3, 0.7)
    },
    fast: {
      r: num(0.9, 1.0),
      g: num(0.1, 0.7),
      b: num(0.2, 0.5)
    }
  }

var speed = {current: 1}

var IS_SPEEDING = false

class Demo {
  constructor(args) 
  {
    this.counter = 0
    this.speed = 1
    this.flareSize = 0
    this.flareRotation = 1

    this.ANGLE = 1
    this.IS_SPEEDING = false


    this.startStats();
    this.startGUI();

    this.renderer = null;
    this.camera   = null;
    this.scene    = null;
    this.counter  = 0;

    this.createRender();
    this.createScene();
    this.addObjects();

    this.cubes = {bottom: [], top: []}
    this.addCubes()
    this.addLight()

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
        clearColor: 0,
        alpha: true
    } );

    this.renderer.gammaInput = true;
    this.renderer.gammaOutput = true;
    document.body.appendChild(this.renderer.domElement)
  }

  createScene()
  {
    const OrbitControls = OC(THREE);

    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.01, 4000 );
    this.camera.position.set(0, 0, 50);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.maxDistance = 500;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog( 0x000000, 0, 300 );
    this.scene.fog.color.setHSL( 0.51, 0.4, 0.01 );
    this.renderer.setClearColor( this.scene.fog.color );
  }

  addObjects()
  {
    var gridHelper = new THREE.GridHelper( 100, 10 );        
    this.scene.add( gridHelper );
    var axisHelper = new THREE.AxisHelper( 1000);        
    this.scene.add( axisHelper );
  }

  addLight() {

    let h = 0.55,
      s = 0.9,
      l = 0.5

    let textureFlare0 = THREE.ImageUtils.loadTexture( "/assets/textures/lensflare/lensflare0.png" ),
         textureFlare2 = THREE.ImageUtils.loadTexture( "/assets/textures/lensflare/lensflare2.png" ),
         textureFlare3 = THREE.ImageUtils.loadTexture( "/assets/textures/lensflare/lensflare3.png" );

    let light = new THREE.PointLight( 0xffffff, 1.5, 300);
    light.color.setHSL( h, s, l );
    light.position.set( 0, -10, -500 );
    this.scene.add( light );

/*
    let cubeGeo = new THREE.BoxGeometry( 10, 10, 10, 10, 10 ),
              cubeMaterial = new THREE.MeshPhongMaterial( { color: 0xffff00 } );
    let cubeMesh = new THREE.Mesh( cubeGeo, cubeMaterial );
    cubeMesh.position.set(0, -10, 0)
    this.scene.add(cubeMesh)
    */


    let flareColor = new THREE.Color( 0xffffff );
          flareColor.setHSL( h, s, l + 0.5 );


    let lensFlare = new THREE.LensFlare( textureFlare0, 700, 0.0, THREE.AdditiveBlending, flareColor );

          lensFlare.add( textureFlare2, 512, 0.0, THREE.AdditiveBlending );
          lensFlare.add( textureFlare2, 512, 0.0, THREE.AdditiveBlending );
          lensFlare.add( textureFlare2, 512, 0.0, THREE.AdditiveBlending );

          lensFlare.add( textureFlare3, 60, 0.6, THREE.AdditiveBlending );
          lensFlare.add( textureFlare3, 70, 0.7, THREE.AdditiveBlending );
          lensFlare.add( textureFlare3, 120, 0.9, THREE.AdditiveBlending );
          lensFlare.add( textureFlare3, 70, 1.0, THREE.AdditiveBlending );

          this.lensFlareUpdateCallback = this.lensFlareUpdateCallback.bind(this)
          lensFlare.customUpdateCallback = this.lensFlareUpdateCallback;
          lensFlare.position.copy( light.position );


          this.scene.add( lensFlare );
  }

  lensFlareUpdateCallback( object ) {

    this.counter++

        var f, fl = object.lensFlares.length;
        var flare;
        var vecX = -object.positionScreen.x * 2;
        var vecY = -object.positionScreen.y * 2;


        for( f = 0; f < fl; f++ ) {

             flare = object.lensFlares[ f ];


             //flare.x *= Math.sin(this.counter)
             //flare.distance = this.flareSize

             flare.x = object.positionScreen.x + vecX * flare.distance;
             flare.y = object.positionScreen.y + vecY * flare.distance;

             flare.rotation = this.counter / (50/this.flareRotation) % (Math.PI*2);
             flare.scale = Math.pow(this.flareSize, 3) * 10


        }

        object.lensFlares[ 2 ].y += 0.025;
        object.lensFlares[ 3 ].rotation = object.positionScreen.x * 0.5 + THREE.Math.degToRad( 45 );

      }

  addCubes() {

    var vector = new THREE.Vector3()
    let r=0
    for (var i=0; i < ROWS; i++) {
      for (var j=0; j < COLS; j++) {


      let geometry = new THREE.BoxGeometry(SIZE.width, SIZE.height, SIZE.depth)

      var uniforms = {
        r: { type: "f", value: COLOURS.slow.r},
        g: { type: "f", value: COLOURS.slow.g},
        b: { type: "f", value: COLOURS.slow.b},
        distanceX: { type: "f", value: 1.0},
        distanceZ: { type: "f", value: 1.0},
        pulse: { type: "f", value: 0.0},
        speed: { type: "f", value: this.speed},
      };
      let material = new THREE.ShaderMaterial( {
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        //fog: true
      });

      let mesh = new THREE.Mesh(geometry, material)
      mesh._row = i
      
      mesh.position.z = -1 * i * (SIZE.depth + GAP)
      mesh._col = j


      //if (MathF.coin(0.5)) {
        if (MathF.coin(0.5)) {
          
          this.cubes.bottom.push(mesh)
        } else {
          
          this.cubes.top.push(mesh)
        }
        this.scene.add(mesh)
      //}

    }
    }
  }

  startGUI()
  {
    var gui = new dat.GUI()
    gui.add(this, 'speed', SPEED.slow, SPEED.fast)
    gui.add(this, 'flareSize', 0, 1)
    gui.add(this, 'flareRotation', 1, 10)
  }

  moveCubes(cubes, plane) {
    var angle = this.speed / SPEED.fast * 90
    
    for (var i=0; i <cubes.length; i++) {
      let mesh = cubes[i]
      let idx = i % COLS
      var phi = (idx / COLS) * Math.PI 

      let y = (Math.sin(phi+0.1) * angle) //- ((phi+0.1) * angle/2),
          
          
      if (plane === 'bottom') {
        y *= -1
        y -= CUBES_OFF 
      } else {
        y += CUBES_OFF 
      }

      //console.log(phi)
      //mesh.rotation.z = (1 - Math.sin(phi+0.1)) * Math.PI/2 * angle
      //mesh.position.applyEuler(new THREE.Euler(0,0,Math.sin(phi+0.1) * 45))

      mesh.position.x = (mesh._col * (SIZE.width + GAP)) - ((SIZE.width + GAP) * COLS / 2)
      mesh.position.y = y
      mesh.position.z += this.speed

      var vector = new THREE.Vector3()
      vector.x = mesh.position.x
      vector.y = mesh.position.y
      vector.z = mesh.position.z
      mesh.lookAt(vector)

      // normalized z distance from camera
      var distanceZ = 1 - ((ALL_DEPTH - mesh.position.z) / (ALL_DEPTH) - 1);
      mesh.material.uniforms.distanceZ.value = distanceZ;
      // normalized x distance from camera (centre)
      var distanceX = 1 - (Math.abs(mesh.position.x)) / (ALL_WIDTH / 2);
      //mesh.material.uniforms.distanceX.value = distanceX;

      mesh.material.uniforms.speed.value = this.speed / SPEED.fast

      if (Math.random() > (0.99995 - this.speed * 0.0003)) {
        mesh.material.uniforms.pulse.value = 1
      }
      mesh.material.uniforms.pulse.value -= 
        mesh.material.uniforms.pulse.value * 0.1 / (this.speed + 1)

      if (mesh.position.z > 0) {
        mesh.position.z = ALL_DEPTH * -1
      }

    }
  }

  update()
  {
    this.stats.begin();

    
    this.moveCubes(this.cubes.bottom, 'bottom')
    this.moveCubes(this.cubes.top, 'top')


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
void main()
{
  vUv = uv;
  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
  gl_Position = projectionMatrix * mvPosition;
}
`
const fragmentShader = `
uniform float r;
uniform float g;
uniform float b;
uniform float distanceZ;
uniform float distanceX;
uniform float pulse;
uniform float speed;
varying vec2 vUv;
void main( void ) {
  vec2 position = abs(-1.0 + 2.0 * vUv);
  float edging = abs((pow(position.y, 5.0) + pow(position.x, 5.0)) / 2.0);
  float perc = (0.2 * pow(speed + 1.0, 2.0) + edging * 0.8) * distanceZ * distanceX;
  float red = r * perc + pulse;
  float green = g * perc + pulse;
  float blue = b * perc + pulse;
  gl_FragColor = vec4(red, green, blue, 1.0);
}
`