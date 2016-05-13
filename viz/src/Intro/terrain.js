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
  terrainHeight: 0.5,
  yDistortion: 0.5,
  xDistortion: 0.5
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

    this.CAMERA_ORB_DIST = 10
    this.TERRAIN_HEIGHT = 1
    this.MOUNTAIN_HEIGHT = 5
    this.PLANE_WIDTH = 40
    this.PLANE_DEPTH = 20

    this.plane1 = null
    this.plane2 = null

    this.orb = null
    this.orbLight = null
    this.orbCamera = this.scene.getCamera()

    this.scene.getScene().fog = new THREE.FogExp2(0xefd1b5, 0.01);

    //this.initPlane()
    this.initLights()
    this.plane1 = this.initPlane()
    this.plane2 = this.initPlane()
    this.plane1.position.set(0, 0, -this.PLANE_DEPTH * 0.5)
    this.plane2.position.set(0, 0, -this.PLANE_DEPTH * 1.5)

    this.initOrb()

    this.initTerrain(this.plane1, 1)
    this.initTerrain(this.plane2, 1)

    this.initMountainTerrain(this.plane1, 1)
    this.initMountainTerrain(this.plane2, 1)
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
    //this.group.add(dirLight)
  }

  initPlane() {


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

    const plane = new THREE.Mesh(geometry, material)
    this.group.add(plane)
    return plane
  }

  generateHeight(width, height, zpos, time) {
    let size = width * height,
      data = new Float32Array(size)

    for (let i = 0; i < size; i++) {
      const x = i % width,
        y = Math.floor(i / width)

      data[i] = simplex.noise4D(x * 0.2, y * 0.3, zpos, time)
    }
    return data
  }


  initMountainTerrain(plane, time) {
    const mountainHeight = conf.mountainHeight * this.MOUNTAIN_HEIGHT
    const speed = conf.speed * 0.5,
      snowHeight = 5,
      waterHeight = 2
    const mountains = []

    for (var i = 0; i <= this.PLANE_DEPTH; i++) {
      const zpos = plane.position.z - i
      //const xoffset = Math.floor(simplex.noise2D(zpos * 0.5, 0.1) * 1)
      const xoffset = Math.floor(this._xDistortion(zpos)) //Math.floor(simplex.noise2D(zpos * 0.5, 0.1) * 1)

      const m = new Mountain({
        depthIdx: i,
        height: conf.mountainHeight * this.MOUNTAIN_HEIGHT,
        range: Math.floor(simplex.noise2D(zpos * 0.1, 0.1) * 4 + 6),
        zpos: zpos,
        xpos: Math.floor(this.PLANE_WIDTH * 1 / 4) + xoffset
      })
      mountains.push(m)

      const mr = new Mountain({
        depthIdx: i,
        height: conf.mountainHeight * this.MOUNTAIN_HEIGHT,
        range: Math.floor(simplex.noise2D(zpos * 0.1, 1) * 4 + 6),
        zpos: zpos,
        xpos: Math.floor(this.PLANE_WIDTH * 3 / 4) + xoffset
      })
      mountains.push(mr)
    }

    const positions = plane.geometry.attributes.position.array,
      colors = plane.geometry.attributes.color.array
    mountains.forEach((m, i) => {
      const idx = m.getDepthIdx() * this.PLANE_WIDTH + m.getXPos() + m.getDepthIdx()
      for (let j = -m.getRange(); j < m.getRange(); j++) {
        const nidx = (idx + j) * 3

        const h = Math.abs(simplex.noise2D(m.getZPos() * 0.5,
          m.getXPos() + j)) * m.height / 2 + m.height / 2

        positions[nidx + 1] += h // m.getHeight(j + m.getRange())
      }
    })

    for (var i = 0, j = 0; i < colors.length; i++, j += 3) {

      const color = positions[j + 1] > snowHeight ? new THREE.Color(0xffff00) :
        (positions[j + 1] < waterHeight ? new THREE.Color(0x00f00f) : new THREE.Color(0xff000f))
      colors[j + 0] = color.r
      colors[j + 1] = color.g
      colors[j + 2] = color.b
    }

    plane.geometry.computeVertexNormals()
    plane.geometry.attributes.position.needsUpdate = true
    plane.geometry.attributes.color.needsUpdate = true
  }

  _yDistortion(z) {
    return simplex.noise2D(z * conf.yDistortion * 0.1, 0.1) * 1.5
  }

  _xDistortion(z) {
    return simplex.noise2D(z * conf.xDistortion * 0.1, 0.1) * 2
  }

  updateOrb(delta) {

    const speed = conf.speed * delta * 7
    const pos = this.orb.position

    const z = pos.z - speed,
      x = 0, //this._xDistortion(z),
      y = this._yDistortion(z),
      v = new THREE.Vector3(x * 2, y * 2 + 2, z),
      vc = new THREE.Vector3(0, 3, z + this.CAMERA_ORB_DIST)

    pos.copy(v)
    this.orbCamera.position.copy(vc)
    this.orbCamera.lookAt(v)
  }

  updateTerrain(plane, time) {
    const speed = conf.speed * 0.6

    const height = this.MOUNTAIN_HEIGHT * conf.mountHeight,
      terrainHeight = conf.terrainHeight * this.TERRAIN_HEIGHT

    const positions = plane.geometry.attributes.position.array,
      colors = plane.geometry.attributes.color.array

    for (var i = 0, j = 0; i < positions.length; i++, j += 3) {
      const depthIdx = Math.floor(i / this.PLANE_WIDTH)
      positions[j + 1] += simplex.noise3D(i, plane.position.z - depthIdx, time) * 0.01
    }
    plane.geometry.attributes.position.needsUpdate = true
  }


  initTerrain(plane, time) {
    const speed = conf.speed * 0.6

    const height = this.MOUNTAIN_HEIGHT * conf.mountHeight,
      terrainHeight = conf.terrainHeight * this.TERRAIN_HEIGHT

    const positions = plane.geometry.attributes.position.array,
      colors = plane.geometry.attributes.color.array

    const data = this.generateHeight(this.PLANE_WIDTH, this.PLANE_DEPTH, plane.position.z, time * 0.1)

    for (var i = 0, j = 0; i < positions.length; i++, j += 3) {
      const depthIdx = Math.floor(i / this.PLANE_WIDTH)
      positions[j + 1] = this._yDistortion(plane.position.z - this.PLANE_DEPTH * (depthIdx / this.PLANE_DEPTH))
    }
    plane.geometry.attributes.position.needsUpdate = true
  }

  update(time, delta) {
    if (this.orb) {
      this.updateOrb(delta)

      const firstPlane = this.plane1.position.z > this.plane2.position.z ? this.plane1 : this.plane2,
        secondPlane = this.plane1.position.z < this.plane2.position.z ? this.plane1 : this.plane2


      if (this.orb.position.z + this.CAMERA_ORB_DIST < firstPlane.position.z - this.PLANE_DEPTH * 0.5) {
        firstPlane.position.setZ(secondPlane.position.z - this.PLANE_DEPTH)

        this.initTerrain(firstPlane, time)
        this.initMountainTerrain(firstPlane, time)
      }
      //this.updateTerrain(firstPlane, time)
      //this.updateTerrain(secondPlane, time)
    }
  }

}

class Mountain {
  constructor(args) {
    this.idx = args.depthIdx
    this.height = args.height
    this.zpos = args.zpos
    this.xpos = args.xpos
    this.anchor = args.anchor
    this.heights = []
    this.setRange(args.range)
  }
  getDepthIdx() {
    return this.idx
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
