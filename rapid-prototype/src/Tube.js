import THREE from 'three'; 
import OC    from 'three-orbit-controls';
import dat   from 'dat-gui' ;
import Stats from 'stats-js' ;
import TweenMax from 'gsap'

const COLS = 26
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
  fast: 30
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
    this.startStats();
    this.startGUI();

    this.ANGLE = 1
    this.IS_SPEEDING = false

    this.renderer = null;
    this.camera   = null;
    this.scene    = null;
    this.counter  = 0;

    this.createRender();
    this.createScene();
    this.addObjects();
    this.addLights()

    this.cubes = {bottom: [], top: []}
    this.addCubes()

    this.onResize();
    this.onMouse()
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
    const OrbitControls = OC(THREE);

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 4000 );
    this.camera.position.set(0, 0, 50);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.maxDistance = 500;

    this.scene = new THREE.Scene();
  }

  addLights() {
    let light = new THREE.AmbientLight()
    this.scene.add(light)
  }

  addObjects()
  {
    var gridHelper = new THREE.GridHelper( 100, 10 );        
    this.scene.add( gridHelper );
    var axisHelper = new THREE.AxisHelper( 1000);        
    this.scene.add( axisHelper );
  }

  addCubes() {

    var vector = new THREE.Vector3()
    let r=0
    for (var i=0; i < COLS*ROWS; i++) {

      // grid
      let idx = i % COLS
      if (idx == 0) {
        r++
      }

      let geometry = new THREE.BoxGeometry(SIZE.width, SIZE.height, SIZE.depth)

      var uniforms = {
        r: { type: "f", value: COLOURS.slow.r},
        g: { type: "f", value: COLOURS.slow.g},
        b: { type: "f", value: COLOURS.slow.b},
        distanceX: { type: "f", value: 1.0},
        distanceZ: { type: "f", value: 1.0},
        pulse: { type: "f", value: 0.0},
        speed: { type: "f", value: speed.current},
      };
      let material = new THREE.ShaderMaterial( {
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader
      });

      let mesh = new THREE.Mesh(geometry, material)
      mesh.row = r
      
      mesh.position.z = -1 * r * (SIZE.depth + GAP)
      //mesh.position.x = (idx * (SIZE.width + GAP)) - ((SIZE.width + GAP) * COLS / 2)


      if (Math.random() > 0.5) {
        if (Math.random() > 0.5) {
          
          this.cubes.bottom.push(mesh)
        } else {
          
          this.cubes.top.push(mesh)
        }
        this.scene.add(mesh)
      }

    }
    
  }

  startGUI()
  {
    // var gui = new dat.GUI()
    // gui.add(camera.position, 'x', 0, 400)
    // gui.add(camera.position, 'y', 0, 400)
    // gui.add(camera.position, 'z', 0, 400)
  }

  moveCubes(cubes, plane) {
    var angle = speed.current / SPEED.fast * 90
    
    for (var i=0; i <cubes.length; i++) {
      let mesh = cubes[i]
      let idx = i % COLS
      var phi = (idx / COLS) * Math.PI  //

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

      mesh.position.x = (idx * (SIZE.width + GAP)) - ((SIZE.width + GAP) * COLS / 2)
      mesh.position.y = y
      mesh.position.z += speed.current

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

      mesh.material.uniforms.speed.value = speed.current / SPEED.fast

      if (Math.random() > (0.99995 - speed.current * 0.0003)) {
        mesh.material.uniforms.pulse.value = 1
      }
      mesh.material.uniforms.pulse.value -= 
        mesh.material.uniforms.pulse.value * 0.1 / (speed.current + 1)

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
  onMouse() {
    window.addEventListener("mousedown", function(e) {
      e.preventDefault()
      IS_SPEEDING = true
        TweenMax.to(speed, 5, {current: SPEED.fast})
    });
    window.addEventListener("mouseup", function(e) {
      e.preventDefault()
      IS_SPEEDING = false
      TweenMax.to(speed, 1, {current: SPEED.slow})
    });
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