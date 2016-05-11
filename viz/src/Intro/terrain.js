const glslify = require('glslify')
const createComplex = require('../utils/createComplex')

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
    group: group,
    scene: scene
  })

  scene.getEvents().on('tick', t => {
    terrain.update(t.time, t.delta)
  })

  scene.addVis(VIS, conf)

}


class Terrain {

  constructor(args) {

    this.group = args.group
    this.scene = args.scene

    this.ORB_COLOR = new THREE.Color(0xff00ff)

    this.TERRAIN_HEIGHT = 1
    this.MOUNTAIN_HEIGHT = 5
    this.PLANE_WIDTH = 40
    this.PLANE_DEPTH = 20

    this.plane1 = null
    this.plane2 = null

    this.mountains = []
    this.orb = null
    this.orbLight = null
    this.orbCamera = this.scene.getCamera()

    this.scene.getScene().fog = new THREE.FogExp2(0xefd1b5, 0.01);

    //this.initPlane()
    this.initLights()
    this.initMountain()
    this.initOrb()
  }

  initOrb() {
    this.scene.getLoader().load(
      '/dist/assets/Intro/fireflie.png', (texture) => {

        const material = new THREE.SpriteMaterial({
          map: texture,
          color: this.ORB_COLOR,
          fog: true
        })

        const sprite = new THREE.Sprite(material)
        this.group.add(sprite)
        this.orb = sprite
        sprite.position.set(0, 3, 0)

        const light = new THREE.PointLight(this.ORB_COLOR, 1, 100);
        light.position.copy(sprite.position)
        this.group.add(light)
        this.orbLight = light

        this.orbCamera.position.set(sprite.position.x,
          sprite.position.y,
          sprite.position.z + 10)
      })
  }

  initLights() {

    const hlight = new THREE.HemisphereLight(
        new THREE.Color(0xffffff),
        new THREE.Color(0xffffff), 0.8)
      this.group.add(hlight)



    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.color.setHSL(0.1, 1, 0.95);
    dirLight.position.set(-1, 1.75, 1);
    dirLight.position.multiplyScalar(50);
    dirLight.castShadow = true;
    dirLight.shadowMapWidth = 2048;
    dirLight.shadowMapHeight = 2048;
    this.group.add(dirLight)
  }

  initMountain() {


    const geometry = new THREE.PlaneBufferGeometry(this.PLANE_WIDTH, this.PLANE_DEPTH,
      this.PLANE_WIDTH, this.PLANE_DEPTH)
    geometry.applyMatrix(new THREE.Matrix4().makeRotationX(Math.PI / 2))

    const positions = geometry.attributes.position.array

    const colors = new Float32Array(positions.length)
    geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(0xffebff),
      shading: THREE.FlatShading,
      side: THREE.DoubleSide,
      wireframe: true,
      vertexColors: THREE.VertexColors
    })


    const plane1 = new THREE.Mesh(geometry, material)
    plane1.position.set(0, 0, 0)
    this.plane1 = plane1

    const plane2 = new THREE.Mesh(geometry, material)
    plane2.position.set(0, 0, -this.PLANE_DEPTH)
    this.plane2 = plane2


    this.group.add(plane1)
    this.group.add(plane2)

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

  generateHeight(width, height, zpos, time) {
    //const seed = randomInt(10, 1000)

    let size = width * height,
      data = new Float32Array(size)

    for (let i = 0; i < size; i++) {
      const x = i % width,
        y = Math.floor(i / width)

      data[i] = simplex.noise4D(x * 0.2, y * 0.3, zpos, time)
    }
    return data
  }

  updateTerrain(plane, time) {

    const speed = conf.speed * 0.6

    const height = this.MOUNTAIN_HEIGHT * conf.mountHeight,
      terrainHeight = conf.terrainHeight * this.TERRAIN_HEIGHT
      //console.log(time)

    const positions = plane.geometry.attributes.position.array,
      colors = plane.geometry.attributes.color.array

    const data = this.generateHeight(this.PLANE_WIDTH, this.PLANE_DEPTH, plane.position.z, time * 0.1)
      //console.log(data)
    for (var i = 0, j = 0; i < positions.length; i++, j += 3) {
      const z = Math.floor(i / this.PLANE_WIDTH)

      positions[j + 1] = simplex.noise2D(plane.position.z - z * 0.05, 1/*time * speed*/) * 1
      //positions[j + 1] += data[i] * terrainHeight
    }

    plane.geometry.attributes.position.needsUpdate = true

  }

  initMountainTerrain(plane) {
    const mountainHeight = conf.mountainHeight * this.MOUNTAIN_HEIGHT

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

    const positions = plane.geometry.attributes.position.array,
      colors = plane.geometry.attributes.color.array


      this.mountains.forEach((m, i) => {

        m.setZPos(m.getZPos() - speed * 0.2)
        if (Math.floor(m.getZPos()) < this.PLANE_DEPTH) {
          const idx = Math.floor(m.getZPos()) * this.PLANE_WIDTH + m.getXPos() + Math.floor(m.getZPos())

          for (let j = -m.getRange(); j < m.getRange(); j++) {
            const nidx = (idx + j) * 3
            positions[nidx + 1] += m.getHeight(j + m.getRange())


          }
          if (m.getZPos() < 0) {
            m.setZPos(this.PLANE_DEPTH)
            m.setRange(randomInt(2, 8))
            m.setMaxHeight( /*simplex.noise2D(i, time * 0.1) */ mountainHeight)
            m.setXPos(m.getAnchor() + Math.floor(simplex.noise2D(m.getZPos(), time * speed) * 5))
          }
        }
      })

      for (var i = 0, j = 0; i < colors.length; i++, j += 3) {

        const color = positions[j + 1] > snowHeight ? new THREE.Color(0xffff00) :
          (positions[j + 1] < waterHeight ? new THREE.Color(0x00f00f) : new THREE.Color(0xff000f))
        colors[j + 0] = color.r
        colors[j + 1] = color.g
        colors[j + 2] = color.b
      }

      this.planeMesh.geometry.computeVertexNormals()
      this.planeMesh.geometry.attributes.position.needsUpdate = true
      this.planeMesh.geometry.attributes.color.needsUpdate = true


  }

  updateMountains(time) {

    const speed = conf.speed * 0.5
    const snowHeight = 5,
      waterHeight = 2


    const mountainHeight = conf.mountainHeight * this.MOUNTAIN_HEIGHT

    const positions = this.planeMesh.geometry.attributes.position.array,
      colors = this.planeMesh.geometry.attributes.color.array

    this.mountains.forEach((m, i) => {

      m.setZPos(m.getZPos() - speed * 0.2)
      if (Math.floor(m.getZPos()) < this.PLANE_DEPTH) {
        const idx = Math.floor(m.getZPos()) * this.PLANE_WIDTH + m.getXPos() + Math.floor(m.getZPos())

        for (let j = -m.getRange(); j < m.getRange(); j++) {
          const nidx = (idx + j) * 3
          positions[nidx + 1] += m.getHeight(j + m.getRange())


        }
        if (m.getZPos() < 0) {
          m.setZPos(this.PLANE_DEPTH)
          m.setRange(randomInt(2, 8))
          m.setMaxHeight( /*simplex.noise2D(i, time * 0.1) */ mountainHeight)
          m.setXPos(m.getAnchor() + Math.floor(simplex.noise2D(m.getZPos(), time * speed) * 5))
        }
      }
    })

    for (var i = 0, j = 0; i < colors.length; i++, j += 3) {

      const color = positions[j + 1] > snowHeight ? new THREE.Color(0xffff00) :
        (positions[j + 1] < waterHeight ? new THREE.Color(0x00f00f) : new THREE.Color(0xff000f))
      colors[j + 0] = color.r
      colors[j + 1] = color.g
      colors[j + 2] = color.b
    }

    this.planeMesh.geometry.computeVertexNormals()
    this.planeMesh.geometry.attributes.position.needsUpdate = true
    this.planeMesh.geometry.attributes.color.needsUpdate = true
  }

  updateOrb(delta) {

    const pos = this.orb.position

    const x = simplex.noise3D(1, pos.y * 0.1, delta),
      y = simplex.noise3D(pos.x * 0.1, 1, delta),
      z = pos.z - delta * 3,
      v = new THREE.Vector3(x * 2, y * 2 + 2, z),
      vc = new THREE.Vector3(0, 10, z + 20)

    pos.copy(v)
    this.orbCamera.position.copy(vc)
    this.orbCamera.lookAt(v)


  }

  update(time, delta) {
    this.updateTerrain(this.plane1, time)
    this.updateTerrain(this.plane2, time)

    //this.updateMountains(this.plane1, time)
    //this.updateMountains(this.plane2, time)

    if (this.orb) {
      this.updateOrb(delta)

      if (this.orb.position.z < (this.plane1.position.z - this.PLANE_DEPTH/2)) {
        console.log("smaller")
        this.plane1.position.setZ(this.plane1.position.z - this.PLANE_DEPTH*2)
        const tmpPlane = this.plane1
        this.plane1 = this.plane2
        this.plane2 = tmpPlane
      }
    }
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
      const factor = Math.sin(i / range * 2)
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
