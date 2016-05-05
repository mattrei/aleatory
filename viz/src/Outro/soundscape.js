global.THREE = require('three')

const simplex = new(require('simplex-noise'))()
const noise = new(require('noisejs')).Noise(Math.random())

const random = require('random-float')
const randomInt = require('random-int')

const tweenr = require('tweenr')()
const Tween = require('tween-chain')

const glslify = require('glslify')
const GeometryUtils = require('../utils/GeometryUtils')

const smoothstep = require('smoothstep')

const VIS = 'soundscape'


const conf = {
  on: true
}

const SIZE = {
  WIDTH: 128,
  DEPTH: 128
}

function soundscape(scene, on = false) {

  conf.on = on
  const group = new THREE.Group()
  group.visible = conf.on
  scene.getScene().add(group)

  scene.getLoader().load('/assets/Outro/particle.png', texture => {

    const ss = new Soundscape({
      group: group,
      particle: texture,
      scene: scene
    })

    scene.getEvents().on('tick', t => {
      ss.update(t.time)
    })
  })


  scene.addVis(VIS, conf)
}


class Soundscape {
  constructor(args) {

    this.MAX_HEIGHT = 20
    this.particle = args.particle
    this.group = args.group
    this.scene = args.scene

    this.seed = randomInt(0, 100)

    this.geometry = new THREE.PlaneBufferGeometry(500, 500, SIZE.WIDTH - 1, SIZE.DEPTH - 1);
    // trick! make the underground visible and not the top
    this.geometry.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI / 2))

    this.material = new THREE.MeshBasicMaterial({
      color: 0x448844,
      shading: THREE.FlatShading,
      wireframe: false,
      wireframeLinewidth: 2,
      transparent: true
    });


    this.mesh = new THREE.Mesh(this.geometry, this.material)

    this.group.add(this.mesh)

    this.initPlane()
    this.initParticles()
  }
  initPlane() {

    const positions = this.geometry.attributes.position.array
    // save base position of plane
    const basePos = new Float32Array(positions.length);

    let data = this.generateHeight(SIZE.WIDTH, SIZE.DEPTH)
    for (var i = 0, j = 0; i < positions.length; i++, j += 3) {
      // only modifiy y of plane position
      positions[j + 1] = data[i] * this.MAX_HEIGHT;
      basePos[i] = positions[j + 1];
    }
    this.geometry.addAttribute('basePos', new THREE.BufferAttribute(basePos, 1));
  }
  generateHeight(width, height) {
    let size = width * height,
      data = new Float32Array(size)

    for (let i = 0; i < size; i++) {

      const x = i % width,
        y = Math.floor(i / width)
      data[i] = simplex.noise2D(this.seed + x * 0.02, y * 0.03)
    }
    return data
  }
  initParticles() {
    this.pointsMaterial = new THREE.ShaderMaterial({
      uniforms: {
        amplitude: {
          type: "f",
          value: 1.0
        },
        bcolor: {
          type: "c",
          value: new THREE.Color(0xffffff)
        },
        tcolor: {
          type: "c",
          value: new THREE.Color(0xff0000)
        },
        texture: {
          type: "t",
          value: this.particle
        },
        time: {
          type: "f",
          value: 0
        }
      },
      vertexShader: glslify('./Soundscape.vert'),
      fragmentShader: glslify('./Soundscape.frag'),
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      opacity: 0.7,
      // vertexColors: THREE.VertexColors,
    })

    const positions = this.geometry.attributes.position.array
    const colors = new Float32Array(positions.length * 3)
    const sizes = new Float32Array(positions.length)


    const color = new THREE.Color(0xffaa00) // red
    for (let v = 0; v < positions.length; v++) {

      colors[v * 3 + 0] = color.r
      colors[v * 3 + 1] = color.g
      colors[v * 3 + 2] = color.b

      if (positions[v] < 0) // does what?
        color.setHSL(0.5 + 0.1 * (v / positions.length), 0.7, 0.5);
      else
        color.setHSL(0.0 + 0.1 * (v / positions.length), 0.9, 0.5);

      sizes[v] = Math.floor(random(1, 5))
    }


  //  this.geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3))
    this.geometry.addAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const points = new THREE.Points(this.geometry, this.pointsMaterial)

    this.group.add(points)
  }
  update(time) {

    const freq = this.scene.getFreq(20, 100)

    let positions = this.geometry.attributes.position.array
    let basePositions = this.geometry.attributes.basePos.array

    for (var i = 0, j = 0, l = positions.length; i < l; i++, j += 3) {
      const destVal = basePositions[i] + freq * basePositions[i] * 0.5
      positions[j+1] += (destVal - positions[j+1])
    }


    this.pointsMaterial.uniforms.time.value = time

    this.geometry.attributes.size.needsUpdate = true
    this.geometry.attributes.position.needsUpdate = true
    //this.geometry.attributes.color.needsUpdate = true
  }
}


export default soundscape
