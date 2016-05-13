const simplex = new(require('simplex-noise'))
const random = require('random-float')
const randomInt = require('random-int')
const clamp = require('clamp')

const tweenr = require('tweenr')()
const Tween = require('tween-chain')

const glslify = require('glslify')


const VIS = 'street'
const conf = {
  on: false,
  speed: 1,
  cars: false
}

function street(scene, on = false) {

  const group = new THREE.Group()
  conf.on = on
  group.visible = conf.on
  scene.getScene().add(group)


  scene.getScene().add(new THREE.AmbientLight(0xffffff))

  scene.getEvents().on(VIS + '::visOn', _ => scene.fadeIn(group, 2))
  scene.getEvents().on(VIS + '::visOff', _ => scene.fadeOut(group, 2))

  const street = new Street({
    group: group,
    scene: scene
  })

  scene.getEvents().on('tick', t => {
    street.update(t.time, t.delta)
  })

  scene.addVis(VIS, conf)
}

class Street {
  constructor(args) {
    this.NUM_RIBBONS = 25
    this.RIBBON_LENGTH = 50
    this.RIBBON_GAP = 100
    this.RIBBON_START = this.NUM_RIBBONS * this.RIBBON_GAP * -1
    this.STREET_LENGTH = (this.RIBBON_LENGTH + this.RIBBON_GAP) * this.NUM_RIBBONS
    this.STREET_WIDTH = 50

    this.NUM_CARLIGHTS = 8

    this.left = null
    this.right = null
    this.middle = []

    this.scene = args.scene
    this.group = args.group

    this.init()
    this.initCarLights()
  }

  init() {
    let geom = new THREE.PlaneBufferGeometry(3, (this.RIBBON_LENGTH + this.RIBBON_GAP) * this.NUM_RIBBONS, 2, 2)
    let mat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 5,
      transparent: true
    })
    let mesh = new THREE.Mesh(geom, mat)
    mesh.rotation.x = Math.PI * 0.5

    let left = new THREE.Line(new THREE.Geometry(), mat);
    this.group.add(left)
    this.left = left

    let right = new THREE.Line(new THREE.Geometry(), mat);
    this.group.add(right)
    this.right = right

    let middle = []
    for (let i = 1; i < this.NUM_RIBBONS + 1; i++) {
      let geom = new THREE.PlaneGeometry(5, this.RIBBON_LENGTH, 2, 2)
      let mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true
      })

      let mesh = new THREE.Mesh(geom, mat)
      mesh.rotation.x = Math.PI * 0.5

      mesh.position.z = (this.RIBBON_GAP + this.RIBBON_LENGTH) * i * -1

      this.group.add(mesh)
      this.middle.push(mesh)
    }

  }

  _addCarLights(material) {
    const pairs = []
    for (var i = 0; i < this.NUM_CARLIGHTS; i++) {
      let pair = []
      for (let j = 0; j < 2; j++) {

        let sprite = new THREE.Sprite(material)
        sprite.scale.set(90, 40, 1.0);
        //sprite.position.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.75);
        //sprite.position.setLength(200 * Math.random());
        sprite.material.blending = THREE.AdditiveBlending;
        sprite.rotation.x = Math.PI * Math.random()

        sprite.position.set(j * 10, 0, 0)

        sprite.visible = false

        this.group.add(sprite)
        pair.push(sprite)

      }
      let z = -1 * random(50, this.STREET_LENGTH)
      pair[0].position.z = pair[1].position.z = z

      pair._speed = random(1, 1.5)

      pairs.push(pair)

    }
    return pairs
  }

  initCarLights() {

    this.scene.getLoader().load(
      '/dist/assets/Intro/cloud.png', (texture) => {

        let matFront = new THREE.SpriteMaterial({
            map: texture,
            color: 0xded95f,
            fog: true
          }),
          matBack = new THREE.SpriteMaterial({
            map: texture,
            color: 0xff0000,
            fog: true
          })

        this.backLights = this._addCarLights(matBack)
        this.frontLights = this._addCarLights(matFront)
      })

  }

  _streetDistortion(z, time) {
    return simplex.noise2D(z * 0.0002, time * 1)
  }

  updateCars(time, dt) {

    let zoffset = random(60, 100)

    this.frontLights.forEach((l, i) => {

      let back = this.backLights[i]

      l.forEach((s, j) => {
        s.visible = conf.on

        let pos = s.position

        let z = pos.z + conf.speed * 8 * l._speed
          //let r = Math.sin((t.time + z * 0.2) * 0.02)
        const r = this._streetDistortion(z, time)
        let x = r * 15 + (j * 15) - this.STREET_WIDTH / 2,
          y = r * 8


        if (z > 0) {
          z = this.STREET_LENGTH * -1
          z -= zoffset
        }
        s.position.set(x, y, z)
      })
    })

    this.backLights.forEach((l, i) => {


      l.forEach((s, j) => {

        s.visible = conf.on

        let pos = s.position

        let z = pos.z - conf.speed * 8
          //let r = Math.sin((t.time + z * 0.2) * 0.02)
        const r = this._streetDistortion(z, time)


        let x = r * 15 + (j * 15) + this.STREET_WIDTH / 2,
          y = r * 8


        if (z < -this.STREET_LENGTH) {
          z = 0
          z += zoffset
        }
        s.position.set(x, y, z)
      })

    })
  }

  updateStreet(time, delta) {
    const pos_left = [],
      pos_right = [],
      pos_middle = []

    this.middle.forEach((m, i) => {

      m.position.z += conf.speed * 8

      const r = this._streetDistortion(m.position.z, time)

      m.position.x = r * 15
      m.position.y = r * 8
      m.rotation.z = r * 0.05


      if (m.position.z > 0) { //this.camera.position.z) {
        m.position.z = (this.NUM_RIBBONS * (this.RIBBON_GAP + this.RIBBON_LENGTH) * -1)
      }

      pos_middle.push(new THREE.Vector3(r * 15, r * 8, m.position.z))
      pos_left.push(new THREE.Vector3((r * 15) - this.STREET_WIDTH, r * 8, m.position.z))
      pos_right.push(new THREE.Vector3((r * 15) + this.STREET_WIDTH, r * 8, m.position.z))
    })

    pos_middle.sort((a, b) => a.z - b.z)
    pos_left.sort((a, b) => a.z - b.z)
    pos_right.sort((a, b) => a.z - b.z)

    this.left.geometry.vertices = pos_left
    this.left.geometry.verticesNeedUpdate = true

    this.right.geometry.vertices = pos_right
    this.right.geometry.verticesNeedUpdate = true
  }

  update(time, dt) {
    this.updateStreet(time, dt)
    if (conf.cars && this.frontLights) this.updateCars(time, dt)
  }

}

export default street
