import React from "react"
import THREE from "three"
import TweenMax from "gsap"
import OC from "three-orbit-controls"

const ROWS = 5
const COLS = 10

const SIZE = {
  width: 100,
  height: 30,
  depth: 150,
}
const GAP = 30

const PLANE_OFFSET = 250
const EMPTY = "emptySlot", PLANE_TOP = "top", PLANE_BOTTOM = "bottom"

var speedNormal = 4;
var speedFast = 34;
var speed = speedNormal;
var isSpeeding = false

var allRowsDepth = ROWS * (SIZE.depth + GAP);
var allColsWidth = COLS * (SIZE.depth + GAP);

var mouse = {x: 0, y: 0};
var camPos = {x: 0, y: 0, z: 10};

function num(min, max) { return Math.random() * (max - min) + min; }

class Hommage extends React.Component {
  constructor (props) {
    super(props)
    
    const { w, h } = props
    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer({antialias: true})
    this.renderer.setSize( w, h )
    this.camera = new THREE.PerspectiveCamera( 100, w / h, 1, 10000 )
    this.camera.lookAt(new THREE.Vector3())
    this.scene.add( this.camera )

    const OrbitControls = OC(THREE)
        
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)

    this.boxes1d = []
    this.boxes = {top: [], bottom: []}

    for (let i=0; i < ROWS; i++) {
      this.boxes.top[i] = []
      this.boxes.bottom[i] = []

      for (let j=0; j < COLS; j++) {
        this.boxes.top[i][j] = EMPTY
        this.boxes.bottom[i][j] = EMPTY
      }
    }
    for (let i=0; i < ROWS*COLS; i++) {
      this._createBox()
    }

     var geo = new THREE.BoxGeometry(1,1,1)
    var mat = new THREE.MeshBasicMaterial({ wireframe: true, color: 0xffffff })
    var box = new THREE.Mesh(geo, mat)
    box.position.z = -200
    this.scene.add(box)
    console.log(box)

    /*let r = 0
    for (let i=0; i < ROWS*COLS; i++) {
      if (i % COLS == 0) {
        r++
      }
      var yi = Math.random() > 0.5 ? -300 : 300

      let x = ((i%COLS) * (CUBE_W + GAP)) - ((CUBE_W + GAP) * COLS / 2),
        y = yi,
        z = -1 * r * (CUBE_D + GAP)


      if (Math.random() > 0.25) {
        cubes.push(new Cube({position: new THREE.Vector3(x, y, z)}))
      }
    }
    */
    


  }
  _createBox() {
    var xi = Math.floor(Math.random() * COLS), xai = xi;
    var yi = Math.random() > 0.5 ? 1 : -1, yai = yi === -1 ? PLANE_BOTTOM : PLANE_TOP
    var zi = Math.floor(Math.random() * ROWS), zai = zi;
    var x = (xi - COLS / 2) * (SIZE.width + GAP);
    var y = yi * PLANE_OFFSET;
    var z = zi * (SIZE.depth + GAP);

    if (this.boxes[yai][zai][xai] === EMPTY) {
      var box = this._draw(SIZE);
      box.position.y = y * 20;
      box.isWarping = true;
      box.offset = {x: x, z: 0};
      box.posZ = z;
      this.boxes[yai][zai][xai] = box;
      this.boxes1d.push(box);

      this.scene.add(box);
      /*
      TweenMax.to(box.position, num(0.3, 1), {
        y: y,
        delay: zi * num(0.1, 0.7),
        onComplete: function() {
          box.isWarping = false;
        }
      });
*/
    }
  }
  _draw(props) {
      const colours = {
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
    var uniforms = {
      r: { type: "f", value: colours.slow.r},
      g: { type: "f", value: colours.slow.g},
      b: { type: "f", value: colours.slow.b},
      distanceX: { type: "f", value: 1.0},
      distanceZ: { type: "f", value: 1.0},
      pulse: { type: "f", value: 0},
      speed: { type: "f", value: speed},
    };
    var material = new THREE.ShaderMaterial( {
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader
    });

console.log(props)
    material = new THREE.MeshBasicMaterial({ wireframe: true, color: 0xffffff })
    var geometry = new THREE.BoxGeometry(props.width, props.height, props.depth);
    //var geometry = new THREE.BoxGeometry(1,1,1);
    var object = new THREE.Mesh(geometry, material);
    object.colours = colours;

    return object;
  }
  componentDidMount() {

    
    let c = this.refs.container.getDOMNode()
    c.appendChild(this.renderer.domElement)

    var gridHelper = new THREE.GridHelper( 100, 10 );        
    this.scene.add( gridHelper );

    var axes = new THREE.AxisHelper(2);
    this.scene.add(axes);

/*
    const osc = this.props.osc;
    osc.on("message", (oscMsg) => {
      if (oscMsg.address === '/uniform') {
        var n = oscMsg.args[0]
        var v = oscMsg.args[1]
        if (n === 'scheduled') {
          let d = JSON.parse(v) // scheduled
          this.setState(d);  
        }
        if (n === 'rotate_scheduled') {
          let d = JSON.parse(v) // scheduled
          this.setState(d);  
        }
      }
    })
*/

    this._render()
  }
  move(x, y, z) {
    var box = boxes[y][z][x];
    if (box !== emptySlot) {
      box.position.x = box.offset.x;
      box.position.z = box.offset.z + box.posZ;
      if (box.position.z > 0) {
        box.posZ -= allRowsDepth;
      }
      if (!box.isWarping && Math.random() > 0.999) {
        var dir = Math.floor(Math.random() * 5), xn = x, zn = z, yn = y, yi = 0, xo = 0, zo = 0;
        switch (dir) {
          case 0 : xn++; xo = 1; break;
          case 1 : xn--; xo = -1; break;
          case 2 : zn++; zo = 1; break;
          case 3 : zn--; zo = -1; break;
          case 4 : // this bit isn't really nice, but it works.
            yn = (y === planeTop) ? planeBottom : planeTop;
            yi = (y === planeTop) ? -1 : 1;
            break;
        }
        if (boxes[yn][zn] && boxes[yn][zn][xn] === emptySlot) {
          boxes[y][z][x] = emptySlot;
          box.isWarping = true;
          boxes[yn][zn][xn] = box;
          if (dir === 4) { // slide vertically
            TweenMax.to(box.position, 0.5, {
              y: yi * planeOffset
            });
          } else { // slide horizontally
            TweenMax.to(box.offset, 0.5, {
              x: box.offset.x + xo * (size.width + gap),
              z: box.offset.z + zo * (size.depth + gap),
            });
          }
          TweenMax.to(box.offset, 0.6, {
            onComplete: function() {
              box.isWarping = false;
            }
          });
        }
      }
    }
  }

  _render() {
    speed -= (speed - (isSpeeding ? speedFast : speedNormal)) * 0.05;
    /*
    var box;
    for (var b = 0, bl = this.boxes1d.length; b < bl; b++) {
      box = this.boxes1d[b];
      box.posZ += speed;
      // normalized z distance from camera
      var distanceZ = 1 - ((allRowsDepth - box.posZ) / (allRowsDepth) - 1);
      box.material.uniforms.distanceZ.value = distanceZ;
      // normalized x distance from camera (centre)
      var distanceX = 1 - (Math.abs(box.position.x)) / (allColsWidth / 3);
      box.material.uniforms.distanceX.value = distanceX;
      var colour = isSpeeding ? box.colours.fast : box.colours.slow;
      box.material.uniforms.r.value -= (box.material.uniforms.r.value - colour.r) * 0.1;
      box.material.uniforms.g.value -= (box.material.uniforms.g.value - colour.g) * 0.1;
      box.material.uniforms.b.value -= (box.material.uniforms.b.value - colour.b) * 0.1;
      // normalized speed
      var currentSpeed = (speed - speedNormal) / (speedFast - speedNormal)
      box.material.uniforms.speed.value = currentSpeed;
      // pulses more with more speed... of course!
      if (Math.random() > (0.99995 - currentSpeed * 0.005)) {
        box.material.uniforms.pulse.value = 1;
      }
      box.material.uniforms.pulse.value -= box.material.uniforms.pulse.value * 0.1 / (currentSpeed + 1);
    }
    */ 
    /*
    for (var j = 0, jl = ROWS; j < jl; j++) { // iterate through rows: z
      for (var i = 0, il = COLS; i < il; i++) { // iterate throw cols: x
        move(i, planeBottom, j);
        move(i, planeTop, j);
      };
    };
    */
    //camPos.x -= (camPos.x - mouse.x * 400) * 0.02;
    //camPos.y -= (camPos.y - mouse.y * 150) * 0.05;
    camPos.z = 100
    //console.log(camPos)
    //camPos.z = -100;
    this.camera.position.set(camPos.x, camPos.y, camPos.z)
    this.camera.rotation.y = camPos.x / -1000;
    this.camera.rotation.x = camPos.y / 1000;
    this.camera.rotation.z = (camPos.x - mouse.x * 400) / 2000;
    this.renderer.render( this.scene, this.camera );
    requestAnimationFrame( this._render.bind(this) );
  }

  render () {
    return <div className="container" ref="container"></div>
  }
}

export default Hommage


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