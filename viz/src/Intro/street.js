const simplex = new(require('simplex-noise'))
const random = require('random-float')
const randomInt = require('random-int')
const clamp = require('clamp')

const smoothstep = require('smoothstep')

const tweenr = require('tweenr')()
const Tween = require('tween-chain')

const glslify = require('glslify')

require('../utils/THREE.MeshLine')

const VIS = 'street'
const conf = {
  on: false,
  speed: 0.5,
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

    this.NUM_POINTS = 100
    this.POINTS_GAP = 6
    this.STREET_LENGTH = this.NUM_POINTS * this.POINTS_GAP
    this.STREET_WIDTH = 50

    this.STRIPE_LENGTH = 20
    this.STRIPE_GAP = this.STRIPE_LENGTH / 3
    this.NUM_STRIPES = Math.floor(this.STREET_LENGTH / (this.STRIPE_LENGTH + this.STRIPE_GAP))
    this.NUM_CARLIGHTS = 8

    this.seed = 0

    this.leftGeometry = null
    this.leftLine = null
    this.rightGeometry = null
    this.rightLine = null
    this.middle = []

    this.smoothX = 0;
		this.smoothY = 0;
		this.smoothZ = 0;

    this.cube = null
    this.spline = null

    this.scene = args.scene
    this.group = args.group

    this.orb = this.createOrb()
    this.init()
    this.initCarLights()
  }

  createOrb() {
    const geometry = new THREE.CubeGeometry(1,1)
    const material = new THREE.MeshNormalMaterial()

    const mesh = new THREE.Mesh(geometry, material)
    //this.group.add(mesh)


    return mesh

  }



  init() {

    const points = [
      new THREE.Vector3(0, 0, -20),
      new THREE.Vector3(10, 0, -10),
      new THREE.Vector3(20, 0, -5),
      new THREE.Vector3(5, 0, 0),
      new THREE.Vector3(0, 0, 10),
    ]

    var spline = new THREE.CatmullRomCurve3(points)
    spline.type = 'catmullrom';
    spline.closed = true;


    const subdivisions = 10


    var geometrySpline = new THREE.Geometry();
        for ( var i = 0; i < points.length * subdivisions; i ++ ) {
          var index = i / ( points.length * subdivisions );
          var position = spline.getPoint( index );
          geometrySpline.vertices[ i ] = new THREE.Vector3( position.x, position.y, position.z );
        }

        geometrySpline.computeLineDistances();

        var object = new THREE.Line( geometrySpline, new THREE.LineDashedMaterial( 
          { color: 0xffffff, linewidth: 30, dashSize: 1, gapSize: 0.5 } ) );

        

        this.group.add(object)

    this.spline = spline

    console.log(spline)
    console.log(spline.getPoint(0.5))
    console.log(spline.getPoint(1.1))

    this.cube = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshNormalMaterial())
    this.group.add(this.cube)

    this.group.add(new THREE.AxisHelper())


    this.leftGeometry = new THREE.Geometry()
    this.rightGeometry = new THREE.Geometry()
    for( var j = 0; j < this.leftGeometry.length; j += 3 ) {
			this.leftGeometry[ j ] = this.leftGeometry[ j + 1 ] = this.leftGeometry[ j + 2 ] = 0
			this.rightGeometry[ j ] = this.rightGeometry[ j + 1 ] = this.rightGeometry[ j + 2 ] = 0
		}

    this.leftGeometry[ 0 ] = this.leftGeometry[ 3 ] = -this.STREET_WIDTH / 2
    this.rightGeometry[ 0 ] = this.rightGeometry[ 3 ] = this.STREET_WIDTH / 2

    const material = new THREE.MeshLineMaterial({
      color:new THREE.Color(0xffffff),
      lineWidth:3 }
    )
    let left = new THREE.MeshLine()
    left.setGeometry(this.leftGeometry)
    this.leftLine = left

    let right = new THREE.MeshLine();
    right.setGeometry(this.rightGeometry)
    this.rightLine = right

    const leftMesh = new THREE.Mesh( left.geometry, material );
    const rightMesh = new THREE.Mesh( right.geometry, material );

    
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



  updateCars(time, dt) {

    let zoffset = random(60, 100)

    this.frontLights.forEach((l, i) => {

      let back = this.backLights[i]

      l.forEach((s, j) => {
        s.visible = conf.on

        s.position.z += conf.speed
        let zpos = s.position.z
        const xoffset = this._xDistortion(zpos, time)

        let x = xoffset - this.STREET_WIDTH / 4,
          y = 0

        if (zpos > 0) {
          zpos = this.STREET_LENGTH * -1
          zpos -= zoffset
        }
        s.position.set(x, y, zpos)
      })
    })

    this.backLights.forEach((l, i) => {


      l.forEach((s, j) => {

        s.visible = conf.on

        s.position.z -= conf.speed
        let zpos = s.position.z
        const xoffset = this._xDistortion(zpos, time)

        let x = xoffset + this.STREET_WIDTH / 4,
          y = 0

        if (zpos < -this.STREET_LENGTH) {
          zpos = 0
          zpos += zoffset
        }
        s.position.set(x, y, zpos)
      })

    })
  }

  _xDistortion(z, time) {

    //const factor = Math.sqrt(z/this.NUM_STRIPES * (this.STRIPE_LENGTH + this.STRIPE_GAP), 2)

    return simplex.noise2D(z * 0.002, time * conf.speed) * 50
  }

  _yDistortion(z, time) {


    return simplex.noise2D(z * 0.005, time * 1) * 0.1
  }

  updateStreet(time, delta) {
    const speed = conf.speed
    const smoothCoef = 0.05

    for( var j = 3, i=3; j < this.leftGeometry.length; i++, j += 3 ) {

      const zpos = -i * this.POINTS_GAP

      let xpos = this._xDistortion(zpos, time)

      const factor = Math.sqrt(j / this.leftGeometry.length, 2) //(this.STRIPE_LENGTH + this.STREET_GAP)/this.STREET_LENGTH
      //xpos *= factor

      this.leftGeometry[ j ] = xpos - this.STREET_WIDTH * 0.5
			this.leftGeometry[ j + 1 ] += 0//this._yDistortion(j, time)
			this.leftGeometry[ j + 2 ] = zpos //this.leftGeometry[ j + 5 ] //* speed;


      this.rightGeometry[ j ] = xpos + this.STREET_WIDTH * 0.5
			this.rightGeometry[ j + 1 ] += 0//this._yDistortion(j, time)
			this.rightGeometry[ j + 2 ] = zpos
		}

    const max = this.leftGeometry[ 3 * 5 ],
      min = this.leftGeometry[ 0 ]

    this.leftLine.setGeometry( this.leftGeometry)
    this.rightLine.setGeometry( this.rightGeometry)


    this.middle.forEach((m, i) => {

        m.position.z += conf.speed
        const zpos = m.position.z
        let xpos = this._xDistortion(zpos, time)

        const factor = i/this.middle.length
        xpos *= factor

        m.position.x = xpos
        m.rotation.z = xpos / 20 * 0.5

        if (m.position.z > 0) {//this.camera.position.z) {
            //m.position.z = -this.STREET_LENGTH - (i+1) * (this.STRIPE_LENGTH + this.STRIPE_GAP)
        }
    })

  }
  updateOrb(time, dt) {
    const r = this._streetDistortion(this.orb.position.z, time)

    this.orb.position.x = r * 15
    this.orb.position.y = r * 8
  }

  update(time, dt) {

    var t = (time * conf.speed % this.spline.getLength()) / this.spline.getLength()
    var tn = ((time + 5) * conf.speed % this.spline.getLength()) / this.spline.getLength()

    const p = this.spline.getPointAt(t)

    //console.log(t)
    //this.cube.position.copy(p)
    //this.cube.lookAt( this.spline.getPointAt( tn) );

    const camera = this.scene.getCamera()
    camera.position.copy(p)
    camera.position.y = 0.1
    camera.lookAt( this.spline.getPointAt( tn) );
    //


    //this.updateStreet(time, dt)
    //this.updateOrb(time, dt)
    if (conf.cars && this.frontLights) this.updateCars(time, dt)
  }

}

export default street
