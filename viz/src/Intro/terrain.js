const noise = new(require('noisejs').Noise)(Math.random())
console.log(noise.perlin2(1, 2))

const simplex = new(require('simplex-noise'))()

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
  mountainHeight: 0.5
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



    this.PLANE_WIDTH = 80
    this.PLANE_DEPTH = 60

    this.planeMesh = null

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

    const positions = geometry.attributes.position.array
    const TERRAIN_HEIGHT = 1,
      MOUNTAIN_HEIGHT = 10


    const data = this.generateHeight(this.PLANE_WIDTH, this.PLANE_DEPTH)
    for (var i = 0, j = 0; i < positions.length; i++, j += 3) {
      positions[j + 1] += data[i] * TERRAIN_HEIGHT
    }


    const r = randomInt(0, positions.length / 3)
    const al = this.PLANE_WIDTH * 1 / 4,
      ar = this.PLANE_WIDTH * 3 / 4

    const range = 15

    const leftMountainIdx = [],
      rightMountainIdx = []

    for (var i = 0; i < this.PLANE_DEPTH; i++) {
      const nal = Math.abs(simplex.noise2D(al, i * 0.1)),
        nar = Math.abs(simplex.noise2D(ar, i * 0.1))

      const idxl = i * this.PLANE_WIDTH + Math.floor(nal * range + 1) + al + i,
        idxr = i * this.PLANE_WIDTH + Math.floor(nar * range + 1) + ar + i


      leftMountainIdx.push(idxl)
      rightMountainIdx.push(idxr)

      const nbsl = randomInt(1, 3),
        nbsr = randomInt(1, 3)

      for (let j = -nbsl; j < nbsl; j++) {
        leftMountainIdx.push(idxl + j)
      }
      for (let j = -nbsr; j < nbsr; j++) {
        rightMountainIdx.push(idxr + j)
      }
    }
    leftMountainIdx.forEach((idx, i) => {
      positions[idx * 3 + 1] = Math.abs(simplex.noise2D(idx*0.1, i*0.1)) * MOUNTAIN_HEIGHT
    })
    rightMountainIdx.forEach((idx, i) => {
      positions[idx * 3 + 1] = Math.abs(simplex.noise2D(idx*0.1, i*0.1)) * MOUNTAIN_HEIGHT
    })

    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(0xffebff),
      shading: THREE.FlatShading,
      side: THREE.DoubleSide,
      wireframe: true
    })

    const mountain = new THREE.Mesh(geometry, material)
    this.planeMesh = mountain



    this.group.add(mountain)

  }

  generateHeight(width, height) {
    const seed = randomInt(10, 1000)

    let size = width * height,
      data = new Float32Array(size)

    for (let i = 0; i < size; i++) {
      const x = i % width,
        y = Math.floor(i / width)
      data[i] = simplex.noise2D(seed + x * 0.2, y * 0.3)
    }
    return data
  }

  updateMountains(time) {
    const height = 15 * conf.mountHeight

    const positions = this.planeMesh.geometry.attributes.position.array

    for (var j = 0; j < this.PLANE_WIDTH; j++) {
      const idx = (this.PLANE_DEPTH-1) * this.PLANE_WIDTH + j
      console.log(idx)
        positions[idx * 3 + 1] = 0
    }

    for (var i=0; i < this.PLANE_DEPTH-1; i++) {
      for (var j=0; j < this.PLANE_WIDTH; j++) {
        let idx = i*this.PLANE_WIDTH + j
        let idxNext = (i+1)*this.PLANE_WIDTH + j

        positions[idx*3 + 1] = positions[idxNext*3 + 1]
      }
    }

  }

  update(time) {
    //this.updateMountains()
  }

}

export default terrain
