import THREE from 'three'; 
import dat   from 'dat-gui' ;
import Stats from 'stats-js' ;
var Tweenr = require('tweenr')()

const OrbitControls = require('three-orbit-controls')(THREE);

const SIZE = {width: 10, height: 10, depth: 10}

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

const MIN_SPEED = 80

class Demo {
  constructor(args) 
  {

    this.speed = 80
    this.counter = 0
    this.autoMode = true

    this.startStats();
    this.startGUI();

    this.renderer = null;
    this.camera   = null;
    this.scene    = null;
    this.counter  = 0;
    this.clock    = new THREE.Clock();

    this.createRender();
    this.createScene();
    this.addObjects();

    this.cubes = []
    this.ypos = 0


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
    this.scene.add( gridHelper );
  }

  startGUI()
  {
    var gui = new dat.GUI()
    gui.add(this, 'speed', 1, MIN_SPEED).step(1)
    gui.add(this, 'autoMode')
    gui.add(this, 'addBlock')
    // gui.add(camera.position, 'z', 0, 400)
  }

  addBlock() 
  {

         let e = this.clock.getElapsedTime()

      var uniforms = {
        r: { type: "f", value: COLOURS.slow.r},
        g: { type: "f", value: COLOURS.slow.g},
        b: { type: "f", value: COLOURS.slow.b},
        distanceX: { type: "f", value: 1.0},
        distanceZ: { type: "f", value: 1.0},
        pulse: { type: "f", value: 1 / this.speed},
        speed: { type: "f", value: 1 - (this.speed / MIN_SPEED)},
      };

      let geom = new THREE.BoxGeometry(SIZE.width, SIZE.height, SIZE.depth)
      let mat = new THREE.ShaderMaterial( {
          uniforms: uniforms,
          vertexShader: vertexShader,
          fragmentShader: fragmentShader
        });
      let cube = new THREE.Mesh(geom, mat)

      let rx = Math.round(Math.random() * 2) - 1
      cube.position.x = rx * SIZE.width 

      if (Math.random() < 0.8) {
        this.ypos += SIZE.height 
        
      }
      cube.position.y = this.ypos

      let rz = Math.round(Math.random() * 2) - 1
      cube.position.z = rz * SIZE.depth

      
      
      //this.camera.position.y = this.ypos
      Tweenr.to(this.camera.position, {
        y: this.ypos + (Math.random() * this.speed / 80 * MIN_SPEED) + 80,
        duration: 1 / 80 * this.speed
      })
      

      this.cubes.push(cube)
      this.scene.add(cube)

  }

  animate(dt) {

    if (this.counter % Math.floor(this.speed) == 0) {
      this.addBlock()
    }
  }

  update()
  {
    this.stats.begin();

    this.counter++
    let e = this.clock.getElapsedTime()

    if (this.autoMode) {
      this.animate(this.clock.getDelta())
    }

    this.stats.end()
    

    if (this.cubes.length > 0) {
      this.camera.lookAt(this.cubes[this.cubes.length-1].position)
    }

    
    this.camera.position.x = Math.cos(e * 1 / this.speed * 50) * 100
    this.camera.position.z = Math.sin(e * 1 / this.speed * 50) * 100

    this.renderer.render(this.scene, this.camera);
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
uniform float pulse;
uniform float speed;
varying vec2 vUv;
void main( void ) {
  vec2 position = abs(-1.0 + 2.0 * vUv);
  float edging = abs((pow(position.y, 5.0) + pow(position.x, 5.0)) / 2.0);
  float perc = (0.2 * pow(speed + 1.0, 2.0) + edging * 0.8);
  float red = r * perc + pulse;
  float green = g * perc + pulse;
  float blue = b * perc + pulse;
  gl_FragColor = vec4(red, green, blue, 1.0);
}
`