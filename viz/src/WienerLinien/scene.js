global.THREE = require('three')
import Scene from '../Scene'

require('../utils/THREE.MeshLine')

const tweenr = require('tweenr')()
const Tween = require('tween-chain')

const vignetteBackground = require('three-vignette-background')
const newArray = require('new-array')
const random = require('random-float')
const randomInt = require('random-int')
const randomRadian = () => random(-Math.PI, Math.PI)
const randomRotation = () => newArray(3).map(randomRadian)
const randomSphere = require('gl-vec3/random')
const simplex = new (require('simplex-noise'))()

const runParallel = require('run-parallel')

const lerp = require('lerp')
const clamp = require('clamp')
const smoothstep = require('smoothstep')

//const TextGeometry = require('./geometries/TextGeometry')(THREE)
const FontUtils = require('../utils/FontUtils')


const SCALE_Z=1
const SCALE = 4000

const UP = new THREE.Vector3(0, 1, 0);

const UPDATE_SEC = 15
const SPEED = 1

// CENTER of Vienna
const CENTER_LAT = 48.2
const CENTER_LNG = 16.3667

const TWEEN_DUR = 15 * 1000


const MAIN_COLOR = new THREE.Color('#fff')
const ALT_COLOR = new THREE.Color('#000')

// https://www.youtube.com/watch?v=16oLi1kvLHs
// https://github.com/Makio64/treeline_casestudy/blob/49e10162578d63c3be1107e58f032dece01fafdd/src/coffee/tree_p/Branch.coffee

/*
add map as surface
https://github.com/geommills/esrileaflet3JS/blob/master/scripts/client/src/terrain.js
*/


// TODO
// http://makiopolis.com/

const bgColor1 = new THREE.Color('#fff')
const bgColor2 = new THREE.Color('#283844')
const altBgColor1 = invert(bgColor1)
const altBgColor2 = invert(bgColor2)
function invert (color) {
  return new THREE.Color(1 - color.r, 1 - color.g, 1 - color.b)
}

import stations from './stations'
import jet from './jet'
import tunnel from './tunnel'

class WienerLinien extends Scene {
  constructor(args)
  {
    //super(args, new THREE.Vector3(0,0,640))
    super(args, new THREE.Vector3(0,0,30))

    this.tmpColors = [ new THREE.Color(), new THREE.Color() ]

    //this.intro()
    //this.background()
    //this.haltestellen()
    //this.spirals()

    stations(this, false)
    jet(this, false)
    tunnel(this, true)

    //this.metro()
  }

  intro() {

    const VIS = 'intro'
    const conf = {on: true, num: 100, dist: 500}
    const group = new THREE.Group()
    group.visible = conf.on
    this.scene.add(group)

    this.loader.load('/assets/WienerLinien/particle.png', texture =>  {

      const geometry = new THREE.Geometry(),
        material = new THREE.PointsMaterial({
          color: 0xFFFFFF,
          size: 16,
          //opacity: 0,
          blending: THREE.AdditiveBlending,
          depthTest: false,
          map: texture,
          transparent: true
        })

      for (let i = 0; i < conf.num; i++) {
        const v = new THREE.Vector3(THREE.Math.randFloatSpread(conf.dist), THREE.Math.randFloatSpread(conf.dist), THREE.Math.randFloatSpread(conf.dist))
        geometry.vertices.push(v)
      }


        const points = new THREE.Points(geometry, material)

        const materialLine = new THREE.LineBasicMaterial({
          color: 0xFFFFFF,
          opacity: .6,
          transparent: true
        });
        const line = new THREE.Line(geometry.clone(), materialLine)
        group.add(points)
        group.add(line)


        this.events.on('tick', t => {
          points.rotation.x += Math.PI / 1800;
          line.rotation.x += Math.PI / 1800;
        })
    })



    super.addVis(VIS, conf)

  }

  background() {
    const bg = vignetteBackground()
    this.scene.add(bg)
    this.updateBackground(bg, 1)

    this.createStars(120).forEach(m => this.scene.add(m))
    this.createAsteroids(100).forEach(m => this.scene.add(m))
  }

  updateBackground (bg, colorTween) {
    const [ width, height ] = [window.innerWidth, window.innerHeight]
    // very cool
    this.tmpColors[0].copy(bgColor1).lerp(altBgColor1, colorTween)
    this.tmpColors[1].copy(bgColor2).lerp(altBgColor2, colorTween)
    bg.style({
      aspect: width / height,
      aspectCorrection: false,
      scale: 2.5,
      colors: this.tmpColors,
      grainScale: 1.5 / Math.min(width, height)
    })
  }

  createAsteroids (count, app) {
    const geometries = newArray(6).map(asteroidGeom)
    const material = new THREE.MeshBasicMaterial({
      color: MAIN_COLOR,
      transparent: true,
      wireframe: true
    })
    const meshes = newArray(count).map(() => {
      const geometry = geometries[randomInt(geometries.length)]
      const mesh = new THREE.Mesh(geometry, material.clone())
      mesh.material.opacity = random(0.05, 0.1)
      mesh.scale.multiplyScalar(random(0.1, 1.5))
      mesh.rotation.fromArray(randomRotation())
      mesh.direction = new THREE.Vector3().fromArray(randomSphere([]))
      mesh.position.fromArray(randomSphere([], random(200, 400)))
      return mesh
    })


    this.events.on('tick', t => {
      const dt = t.dt / 100
      meshes.forEach(mesh => {
        mesh.rotation.x += dt * 0.1 * mesh.direction.x
        mesh.rotation.y += dt * 0.5 * mesh.direction.y
      })
    })

    return meshes

    function asteroidGeom () {
      const geometry = new THREE.TetrahedronGeometry(10, randomInt(1, 3))
      geometry.vertices.forEach(v => {
        let steps = 3
        let s = Math.pow(2, steps)
        let a = 0.75
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
      return geometry
    }
  }

  createStars (count) {
    const geometry = new THREE.TetrahedronGeometry(1, 0)
    const material = new THREE.MeshBasicMaterial({
      color: MAIN_COLOR
    })
    const meshes = newArray(count).map(() => {
      const mesh = new THREE.Mesh(geometry, material.clone())
      mesh.material.opacity = random(0.01, 0.5)
      mesh.scale.multiplyScalar(random(1.5, 4.5))
      mesh.rotation.fromArray(randomRotation())
      mesh.position.fromArray(randomSphere([], random(200, 400)))
      return mesh
    })
    let time = 0

    this.events.on('tick', t => {
      //time += 0.1
      //console.log(time)
      meshes.forEach(m => {
        let c = ALT_COLOR.clone().lerp(MAIN_COLOR, 0)
        //m.material.color = c
        //m.material.needsUpdate = true
      })
    })

    return meshes
  }

  colorize() {
    this.lines.forEach(l => {
      l.colorize(Math.random())
    })
  }

  morphScale() {
    this.lines.forEach(l => {
      l.scale(Math.random() * 2)
    })
  }

  topo() {
    const VIS = 'topo'
    const conf = {on: false}

    const group = new THREE.Group()
    this.scene.add(group)
    group.visible = conf.on


     let csv_topo = require('../test_data/WienerLinienTopo.json')
      //console.log(csv_topo)
      this.csv_lines = []
      for (let k of csv_topo.keys()) {
        let line = new Line({scene: this.scene,
          topo:csv_topo[k][1],
          lineColor: 'white',
          linewidth: 1})
        this.lines.push(line)
        //this.csv_lines.push(line)
      }
  }
  morphChaos() {
    this.lines.forEach(l => {
      l.chaos()
    })
  }
  morphOrdered() {
    this.lines.forEach(l => {
      l.ordered()
    })
  }



  followRandomTrain() {

    //this.randomMetro = this.lines[Math.floor(Math.random() * this.lines.length)]
    this.randomMetro = this.u4
    this.randomMetro.followRandomTrain()
  }
  unfollowRandomTrain() {
    this.randomMetro = null
    this.camera.position.set(0, 45, 640)
    this.update()
  }
  tick(time, delta)
  {
    if (this.randomMetro) {
      this.randomMetro.updateFollowTrain(this.camera)
    }
  }






}

export default WienerLinien
