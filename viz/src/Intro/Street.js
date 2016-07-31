const simplex = new(require('simplex-noise'))
const random = require('random-float')
const randomInt = require('random-int')
const clamp = require('clamp')

const smoothstep = require('smoothstep')

const tweenr = require('tweenr')()
const Tween = require('tween-chain')

const glslify = require('glslify')

const conf = {
  on: false,
  speed: 0.5,
  cars: true
}

const STREET_WIDTH = 1
const NUM_CARLIGHTS = 40

export default class Street extends THREE.Object3D {
  constructor(scene) {
    super()

    this.scene = scene

    this.ready = false
    this.tick = 0

    this.spline = null

    this.init()
    this.initCarLights()

    this.scene.getScene().fog = new THREE.FogExp2( 0x000000, 0.25 );
    this.add(new THREE.AmbientLight(0xffffff))
  }


  getConf() {
    return conf
  }

  _genPoints() {
    const points = []
    for (let i=0; i < NUM_CARLIGHTS/2; i++) {
      points.push(new THREE.Vector3(random(-3, 3), random(0, 2), i * 5))
    }
    return points
  }

  init() {

    const LINE_WIDTH = 10
    
    const points = [
      new THREE.Vector3(0, 0, 20),
      new THREE.Vector3(10, 1, 10),
      new THREE.Vector3(20, 0, 5),
      new THREE.Vector3(5, 0.5, 0),
      new THREE.Vector3(0, 0, 10),
    ]


    var spline = new THREE.CatmullRomCurve3(this._genPoints())
    //spline.closed = true

    const SUBD = NUM_CARLIGHTS * 2


    const leftgeom = new THREE.Geometry(),
      middlegeom = new THREE.Geometry(),
      rightgeom = new THREE.Geometry()

        for ( var i = 0; i < points.length * SUBD; i ++ ) {
          var index = i / ( points.length * SUBD );
          var position = spline.getPoint( index );
          
          middlegeom.vertices[ i ] = new THREE.Vector3( position.x, position.y, position.z );
          
          leftgeom.vertices[ i ] = new THREE.Vector3( position.x - STREET_WIDTH*0.5, position.y, position.z );
          rightgeom.vertices[ i ] = new THREE.Vector3( position.x + STREET_WIDTH*0.5, position.y, position.z );
        }
        middlegeom.computeLineDistances()
        leftgeom.computeLineDistances()
        rightgeom.computeLineDistances()

        const middle = new THREE.Line( middlegeom, new THREE.LineDashedMaterial( 
          { color: 0xffffff, linewidth: LINE_WIDTH, dashSize: 0.5, gapSize: 0.5, fog: true } ) );

        this.add(middle)

        const left = new THREE.Line( leftgeom, new THREE.LineBasicMaterial( 
          { color: 0xffffff, linewidth: LINE_WIDTH, fog: true } ) );

        const right = new THREE.Line( rightgeom, new THREE.LineBasicMaterial( 
          { color: 0xffffff, linewidth: LINE_WIDTH, fog: true } ) );

        this.add(left)
        this.add(right)

    this.spline = spline    
  }

  _addCarLights(material) {

    const pairs = []
    for (let i = 0; i < NUM_CARLIGHTS; i++) {
      const pair = []


      const offset = randomInt(0, this.spline.getLength())

      for (let j = 1; j <= 2; j++) {

        let sprite = new THREE.Sprite(material)
        sprite.scale.set(1, 0.5, 1);
        sprite.rotation.x = random(0, Math.PI)

        //sprite.position.copy(pos)
        //sprite.position.x -= STREET_WIDTH/8 * j

        sprite.visible = conf.cars

        this.add(sprite)
        pair.push(sprite)
      }
      
      pair._offset = offset
      pair._speed = random(2, 3.5)
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
            blending: THREE.AdditiveBlending,
            fog: true
          }),
          matBack = new THREE.SpriteMaterial({
            map: texture,
            color: 0xff0000,
            blending: THREE.AdditiveBlending,
            fog: true
          })

        this.backLights = this._addCarLights(matBack)
        this.frontLights = this._addCarLights(matFront)

        this.ready = true
      })

  }



  updateCars(delta) {

    const SPEED = 0.4

    this.frontLights.forEach(pair => {
      const t =  (pair._offset % this.spline.getLength()) / this.spline.getLength(),
         pos = this.spline.getPointAt(t)

      pair[0].position.set(pos.x + STREET_WIDTH/8, pos.y, pos.z)
      pair[1].position.set(pos.x + STREET_WIDTH/8 * 2, pos.y, pos.z)

      pair._offset -= pair._speed * delta
      if (pair._offset < 0) pair._offset = this.spline.getLength()
    })


    this.backLights.forEach(pair => {
      const t =  (pair._offset % this.spline.getLength()) / this.spline.getLength(),
         pos = this.spline.getPointAt(t)

      pair[0].position.set(pos.x - STREET_WIDTH/8, pos.y, pos.z)
      pair[1].position.set(pos.x - STREET_WIDTH/8 * 2, pos.y, pos.z)

      pair._offset += pair._speed * delta
      if (pair._offset > this.spline.getLength()) pair._offset = 0
    })


  }

  update(dt) {

    if (!this.ready) return

    this.tick += dt
    const time = this.tick

    const t = (time * conf.speed % this.spline.getLength()) / this.spline.getLength(),
       tn = ((time + 0.4) * conf.speed % this.spline.getLength()) / this.spline.getLength()

    const p = this.spline.getPointAt(t)

    const camera = this.scene.getCamera()
    camera.position.copy(p)
    camera.position.y += 0.1
    camera.lookAt( this.spline.getPointAt( tn) )

    if (conf.cars) this.updateCars(dt)
  }

}

