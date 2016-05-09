const noise = new(require('noisejs').Noise)(Math.random())
console.log(noise.perlin2(1, 2))

const simplex = new(require('simplex-noise'))()
const smoothstep = require('smoothstep')

const random = require('random-float')
const randomInt = require('random-int')

const tweenr = require('tweenr')()
const Tween = require('tween-chain')

import Color from 'color'

require('../geometries/ConvexGeometry')

const VIS = 'terrain'

const conf = {
  on: false,
  speed: 0.5,
  mountainHeight: 0.5,
  terrainHeight: 0.5
}

function terrain(scene, on = false) {
  conf.on = on

  const group = new THREE.Group()
  scene.getScene().add(group)
  group.visible = conf.on


  scene.getScene().fog = new THREE.FogExp2(0x5fa5d8, 0.0025)

  const terrain = new Terrain({
    group: group
  })

  scene.getEvents().on('tick', t => {
    terrain.update(t.time)
  })

  scene.addVis(VIS, conf)

}

class Terrain {

  constructor(args) {

    this.group = args.group


    this.TERRAIN_HEIGHT = 2
    this.MOUNTAIN_HEIGHT = 5
    this.PLANE_WIDTH = 40
    this.PLANE_DEPTH = 20

    this.planeMesh = null

    this.mountains = []

    this.initPlane()
    this.initLights()
    this.initMountain()
      //this.initRock()
  }

  initRock() {


    const points = []
    for (var i = 0; i < 30; i++) {
      const radius = randomInt(5, 20)
      const v = new THREE.Vector3(
        (simplex.noise2D(i, 10 + i)) * 2 * radius,
        (simplex.noise2D(i + 20, 30 + i)) * 2 * radius,
        (simplex.noise2D(i + 5, 15 + i)) * 2 * radius
      );
      /*
            let steps = 3
            let s = Math.pow(2, steps)
            let a = 12.75
            for (let i = 0; i < steps; i++) {
              v.x += a * simplex.noise3D(v.x * s * 0, v.y * s, v.z * s)
              v.y += a * simplex.noise3D(v.x * s, v.y * s * 0, v.z * s)
              v.z += a * simplex.noise3D(v.x * s, v.y * s, v.z * s * 0)
              s *= 0.25
              a *= 1 / steps * i
            }
      */
      points.push(v);
    }
    console.log(points)

    const geometry = new THREE.ConvexGeometry(points)

    /*
    const geometry = new THREE.TetrahedronGeometry(5, randomInt(1, 2))
    geometry.vertices.forEach(v => {
      let steps = 3
      let s = Math.pow(2, steps)
      let a = 12.75
      for (let i = 0; i < steps; i++) {
        v.x += a * simplex.noise3D(v.x * s * 0, v.y * s, v.z * s)
        v.y += a * simplex.noise3D(v.x * s, v.y * s * 0, v.z * s)
        v.z += a * simplex.noise3D(v.x * s, v.y * s, v.z * s * 0)
        s *= 0.25
        a *= 1 / steps * i
      }
    })
    geometry.computeFaceNormals()
    geometry.verticesNeedsUpdate = true
*/
    const material = new THREE.MeshNormalMaterial({
      wireframe: true
    })

    const mesh = new THREE.Mesh(geometry, material)
    this.group.add(mesh)

  }

  initPlane() {

    const geometry = new THREE.PlaneBufferGeometry(200, 200, 1, 1)
    geometry.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2))
    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(0xffeb00),
      shading: THREE.FlatShading
    })

    const plane = new THREE.Mesh(geometry, material)
    plane.position.y = -5

    //this.group.add(plane)

  }

  initLights() {

    const light = new THREE.HemisphereLight(new THREE.Color(0xe7b300), new THREE.Color(0xee8012), 1)
    this.group.add(light)
  }

  initMountain() {


    const geometry = new THREE.PlaneBufferGeometry(this.PLANE_WIDTH, this.PLANE_DEPTH,
      this.PLANE_WIDTH, this.PLANE_DEPTH)
    geometry.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI / 2))

    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(0xffebff),
      shading: THREE.FlatShading,
      side: THREE.DoubleSide,
      wireframe: true
    })

    const mountain = new THREE.Mesh(geometry, material)
    this.planeMesh = mountain

    this.group.add(mountain)

    for (var i = 0; i < this.PLANE_DEPTH; i++) {
      //const nal = Math.abs(simplex.noise3D(20, i * 0.1, 0.1)),

      const m = new Mountain({
        height: conf.mountainHeight * this.MOUNTAIN_HEIGHT,
        range: randomInt(4, 8),
        zpos: this.PLANE_DEPTH + i,
//        xpos: this.PLANE_WIDTH * 1 / 4,
        anchor: this.PLANE_WIDTH * 1 / 4
      })
      this.mountains.push(m)

      const mr = new Mountain({
        height: conf.mountainHeight * this.MOUNTAIN_HEIGHT,
        range: randomInt(4, 8),
        zpos: this.PLANE_DEPTH + i,
        //xpos: this.PLANE_WIDTH * 3 / 4,
        anchor: this.PLANE_WIDTH * 3 / 4
      })
      this.mountains.push(mr)
    }

  }

  generateHeight(width, height, time) {
    //const seed = randomInt(10, 1000)

    let size = width * height,
      data = new Float32Array(size)

    for (let i = 0; i < size; i++) {
      const x = i % width,
        y = Math.floor(i / width)

      data[i] = simplex.noise3D(x * 0.2, y * 0.3, time)
    }
    return data
  }

  updateTerrain(time) {

    const speed = conf.speed * 0.6

    const height = this.MOUNTAIN_HEIGHT * conf.mountHeight,
      terrainHeight = conf.terrainHeight * this.TERRAIN_HEIGHT
      //console.log(time)

    const positions = this.planeMesh.geometry.attributes.position.array

    const data = this.generateHeight(this.PLANE_WIDTH, this.PLANE_DEPTH, time * 0.1)
      //console.log(data)
    for (var i = 0, j = 0; i < positions.length; i++, j += 3) {


      const z = Math.floor(i / this.PLANE_WIDTH)
      positions[j + 1] = simplex.noise2D(z * 0.05, time*speed) * 1


      positions[j + 1] += data[i] * terrainHeight
    }



    this.planeMesh.geometry.attributes.position.needsUpdate = true
  }

  updateMountains(time) {

    const speed = conf.speed * 0.6

    const mountainHeight = conf.mountainHeight * this.MOUNTAIN_HEIGHT

    const positions = this.planeMesh.geometry.attributes.position.array

    this.mountains.forEach((m, i) => {

      m.setZPos(m.getZPos() - 0.2)
      if (Math.floor(m.getZPos()) < this.PLANE_DEPTH) {
        const idx = Math.floor(m.getZPos()) * this.PLANE_WIDTH + m.getXPos() + Math.floor(m.getZPos())

        for (let j = -m.getRange(); j < m.getRange(); j++) {
          positions[(idx + j) * 3 + 1] += m.getHeight(j + m.getRange())
        }
        if (m.getZPos() < 0) {
          m.setZPos(this.PLANE_DEPTH)
          m.setRange(randomInt(2, 8))
          m.setMaxHeight(/*simplex.noise2D(i, time * 0.1) */ mountainHeight)
          m.setXPos(m.getAnchor() + Math.floor(simplex.noise2D(m.getZPos(), time * speed)*5))
        }
      }
    })

    this.planeMesh.geometry.attributes.position.needsUpdate = true
  }

  update(time) {
    this.updateTerrain(time)
    this.updateMountains(time)
  }

}

class Mountain {
  constructor(args) {
    this.height = args.height
    this.zpos = args.zpos
    this.xpos = args.xpos
    this.anchor = args.anchor
    this.heights = []
    this.setRange(args.range)
  }
  getZPos() {
    return this.zpos
  }
  getXPos() {
    return this.xpos
  }
  getAnchor() {
    return this.anchor
  }
  setXPos(xpos) {
    this.xpos = xpos
  }
  setZPos(zpos) {
    this.zpos = zpos
  }
  getRange() {
    return this.range
  }
  setRange(range) {
    this.range = range

    this.heights = []
    const seed = random(1, 100)
    for (let i = 0; i < range * 2; i++) {
      const factor = Math.sin(i/range*2)
      this.heights.push(Math.abs(simplex.noise2D(i, seed)) * factor * this.height / 2 + this.height / 2)
    }
  }
  setMaxHeight(height) {
    this.height = height
  }
  getMaxHeight() {
    return this.height
  }
  getHeight(i) {
    return this.heights[i]
  }
}

export default terrain
